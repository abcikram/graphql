import Redis from "ioredis";
import { ENV } from "../../config/env";

type Listener<T> = (payload: T) => void;

export interface ChatPubSub {
  publish<T>(topic: string, payload: T): Promise<void> | void;
  asyncIterator<T>(topic: string): AsyncIterableIterator<T>;
}

class AsyncQueueIterator<T> implements AsyncIterableIterator<T> {
  private queue: T[] = [];
  private waiting: Array<(result: IteratorResult<T>) => void> = [];
  private closed = false;

  constructor(private readonly onClose: () => void) {}

  push(value: T) {
    if (this.closed) {
      return;
    }

    const resolver = this.waiting.shift();
    if (resolver) {
      resolver({ value, done: false });
      return;
    }

    this.queue.push(value);
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.queue.length > 0) {
      return { value: this.queue.shift() as T, done: false };
    }

    if (this.closed) {
      return { value: undefined as never, done: true };
    }

    return new Promise<IteratorResult<T>>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  async return(): Promise<IteratorResult<T>> {
    this.closed = true;
    this.onClose();

    while (this.waiting.length > 0) {
      this.waiting.shift()?.({ value: undefined as never, done: true });
    }

    return { value: undefined as never, done: true };
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
}

export class InMemoryPubSub implements ChatPubSub {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  publish<T>(topic: string, payload: T) {
    const topicListeners = this.listeners.get(topic);
    if (!topicListeners) {
      return;
    }

    for (const listener of topicListeners) {
      listener(payload);
    }
  }

  asyncIterator<T>(topic: string): AsyncIterableIterator<T> {
    const listenerSet = this.listeners.get(topic) ?? new Set<Listener<unknown>>();
    this.listeners.set(topic, listenerSet);

    const iterator = new AsyncQueueIterator<T>(() => {
      listenerSet.delete(listener as Listener<unknown>);
      if (listenerSet.size === 0) {
        this.listeners.delete(topic);
      }
    });

    const listener = (payload: T) => iterator.push(payload);
    listenerSet.add(listener as Listener<unknown>);

    return iterator;
  }
}

export class RedisChatPubSub implements ChatPubSub {
  private publisher: Redis;
  private subscriber: Redis;
  private listeners = new Map<string, Set<Listener<unknown>>>();

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl);
    this.subscriber = this.publisher.duplicate();

    this.subscriber.on("message", (channel, message) => {
      const topicListeners = this.listeners.get(channel);
      if (!topicListeners) {
        return;
      }

      const payload = JSON.parse(message);
      for (const listener of topicListeners) {
        listener(payload);
      }
    });
  }

  async publish<T>(topic: string, payload: T) {
    await this.publisher.publish(topic, JSON.stringify(payload));
  }

  asyncIterator<T>(topic: string): AsyncIterableIterator<T> {
    const listenerSet = this.listeners.get(topic) ?? new Set<Listener<unknown>>();
    this.listeners.set(topic, listenerSet);

    const iterator = new AsyncQueueIterator<T>(() => {
      listenerSet.delete(listener as Listener<unknown>);

      if (listenerSet.size === 0) {
        this.listeners.delete(topic);
        void this.subscriber.unsubscribe(topic);
      }
    });

    const listener = (payload: T) => iterator.push(payload);
    listenerSet.add(listener as Listener<unknown>);

    if (listenerSet.size === 1) {
      void this.subscriber.subscribe(topic);
    }

    return iterator;
  }
}

export const createChatPubSub = (): ChatPubSub => {
  if (ENV.REDIS_URL) {
    return new RedisChatPubSub(ENV.REDIS_URL);
  }

  return new InMemoryPubSub();
};
