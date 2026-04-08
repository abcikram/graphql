import { GraphQLError } from "graphql";
import { Types } from "mongoose";
import { encodeCursor } from "../../utils/cursor";
import { UserRepository } from "../user/user.repository";
import {
  ConversationType,
  CreateGroupConversationArgs,
  IConversation,
  IMessage,
  MarkConversationReadArgs,
  MessageDeliveryStatus,
  PublishTypingIndicatorArgs,
  SendMessageArgs,
} from "./interface/chat.interface";
import { ChatRepository } from "./chat.repository";
import { ChatPubSub } from "./chat.pubsub";

const CHAT_MESSAGE_SENT = "CHAT_MESSAGE_SENT";
const CHAT_TYPING = "CHAT_TYPING";

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userRepository: UserRepository,
    private readonly pubSub: ChatPubSub,
  ) {}

  async createDirectConversation(currentUserId: string, participantId: string) {
    this.assertAuthenticated(currentUserId);
    this.assertNotSameUser(currentUserId, participantId);

    await this.ensureUsersExist([currentUserId, participantId]);

    const participantObjectIds = [currentUserId, participantId]
      .map((id) => new Types.ObjectId(id))
      .sort((a, b) => a.toString().localeCompare(b.toString()));

    const existingConversation =
      await this.chatRepository.findDirectConversationByParticipants(
        participantObjectIds,
      );

    if (existingConversation) {
      return existingConversation;
    }

    return this.chatRepository.createConversation({
      type: ConversationType.DIRECT,
      createdBy: new Types.ObjectId(currentUserId),
      participants: participantObjectIds.map((userId) => ({
        userId,
        joinedAt: new Date(),
      })),
    });
  }

  async createGroupConversation(
    currentUserId: string,
    input: CreateGroupConversationArgs,
  ) {
    this.assertAuthenticated(currentUserId);

    const uniqueParticipantIds = Array.from(
      new Set([currentUserId, ...input.participantIds]),
    );

    if (uniqueParticipantIds.length < 3) {
      throw new GraphQLError("Group chat requires at least 3 participants", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    await this.ensureUsersExist(uniqueParticipantIds);

    return this.chatRepository.createConversation({
      type: ConversationType.GROUP,
      title: input.title.trim(),
      createdBy: new Types.ObjectId(currentUserId),
      participants: uniqueParticipantIds.map((id) => ({
        userId: new Types.ObjectId(id),
        joinedAt: new Date(),
      })),
    });
  }

  async getConversationById(id: string, currentUserId: string) {
    this.assertAuthenticated(currentUserId);
    const conversation = await this.chatRepository.findConversationById(id);
    this.assertMembership(conversation, currentUserId);
    return conversation;
  }

  async getUserConversations(currentUserId: string, first: number, after?: string) {
    this.assertAuthenticated(currentUserId);

    const result = await this.chatRepository.paginateConversationsForUser(
      currentUserId,
      first,
      after,
    );

    const edges = result.data.map((conversation: any) => ({
      node: {
        ...conversation,
        id: String(conversation._id),
      },
      cursor: encodeCursor(String(conversation._id)),
    }));

    return {
      edges,
      pageInfo: result.pageInfo,
    };
  }

  async getConversationMessages(
    currentUserId: string,
    conversationId: string,
    first: number,
    after?: string,
  ) {
    this.assertAuthenticated(currentUserId);

    const conversation = await this.chatRepository.findConversationById(conversationId);
    this.assertMembership(conversation, currentUserId);

    const result = await this.chatRepository.paginateMessages(
      conversationId,
      first,
      after,
    );

    const edges = result.data.map((message: any) => ({
      node: {
        ...message,
        id: String(message._id),
      },
      cursor: encodeCursor(String(message._id)),
    }));

    return {
      edges,
      pageInfo: result.pageInfo,
    };
  }

  async sendMessage(currentUserId: string, input: SendMessageArgs) {
    this.assertAuthenticated(currentUserId);

    const conversation = await this.chatRepository.findConversationById(
      input.conversationId,
    );
    this.assertMembership(conversation, currentUserId);

    if (input.clientMessageId) {
      const existingMessage = await this.chatRepository.findMessageByClientMessageId(
        input.conversationId,
        input.clientMessageId,
      );

      if (existingMessage) {
        return existingMessage;
      }
    }

    const createdAt = new Date();
    const message = await this.chatRepository.createMessage({
      conversationId: new Types.ObjectId(input.conversationId),
      senderId: new Types.ObjectId(currentUserId),
      content: input.content.trim(),
      clientMessageId: input.clientMessageId,
      deliveryStatus: MessageDeliveryStatus.SENT,
      deliveryAttempts: [
        {
          status: MessageDeliveryStatus.SENT,
          attemptedAt: createdAt,
        },
      ],
    });

    await this.chatRepository.updateConversationAfterMessage(
      new Types.ObjectId(input.conversationId),
      message._id as Types.ObjectId,
      message.createdAt,
    );

    this.pubSub.publish(`${CHAT_MESSAGE_SENT}:${input.conversationId}`, {
      messageSent: message,
    });

    return message;
  }

  async markConversationRead(currentUserId: string, input: MarkConversationReadArgs) {
    this.assertAuthenticated(currentUserId);

    const conversation = await this.chatRepository.findConversationById(
      input.conversationId,
    );
    this.assertMembership(conversation, currentUserId);

    const message = await this.chatRepository.findMessageById(input.messageId);
    if (!message || String(message.conversationId) !== input.conversationId) {
      throw new GraphQLError("Message not found in conversation", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    await this.chatRepository.markConversationRead(
      input.conversationId,
      currentUserId,
      input.messageId,
      new Date(),
    );

    return true;
  }

  async getMessageById(messageId: string) {
    return this.chatRepository.findMessageById(messageId);
  }

  async publishTypingIndicator(
    currentUserId: string,
    input: PublishTypingIndicatorArgs,
  ) {
    this.assertAuthenticated(currentUserId);

    const conversation = await this.chatRepository.findConversationById(
      input.conversationId,
    );
    this.assertMembership(conversation, currentUserId);

    this.pubSub.publish(`${CHAT_TYPING}:${input.conversationId}`, {
      typingIndicator: {
        conversationId: input.conversationId,
        userId: currentUserId,
        isTyping: input.isTyping,
        emittedAt: new Date().toISOString(),
      },
    });

    return true;
  }

  messageIterator(conversationId: string) {
    return this.pubSub.asyncIterator<{ messageSent: IMessage }>(
      `${CHAT_MESSAGE_SENT}:${conversationId}`,
    );
  }

  typingIterator(conversationId: string) {
    return this.pubSub.asyncIterator<{
      typingIndicator: {
        conversationId: string;
        userId: string;
        isTyping: boolean;
        emittedAt: string;
      };
    }>(`${CHAT_TYPING}:${conversationId}`);
  }

  getUnreadCount(conversation: IConversation, currentUserId: string) {
    const participant = conversation.participants.find(
      (entry) => entry.userId.toString() === currentUserId,
    );

    if (!participant?.lastReadAt && conversation.lastMessageAt) {
      return 1;
    }

    if (!participant?.lastReadAt || !conversation.lastMessageAt) {
      return 0;
    }

    return conversation.lastMessageAt > participant.lastReadAt ? 1 : 0;
  }

  private async ensureUsersExist(userIds: string[]) {
    const users = await Promise.all(
      userIds.map((userId) => this.userRepository.findById(userId)),
    );

    const missingUser = users.findIndex((user) => !user);
    if (missingUser !== -1) {
      throw new GraphQLError("One or more users were not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
  }

  private assertAuthenticated(userId?: string) {
    if (!userId) {
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
  }

  private assertNotSameUser(currentUserId: string, participantId: string) {
    if (currentUserId === participantId) {
      throw new GraphQLError("Direct chat requires a second participant", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
  }

  private assertMembership(conversation: IConversation | null, currentUserId: string) {
    if (!conversation) {
      throw new GraphQLError("Conversation not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.userId.toString() === currentUserId,
    );

    if (!isParticipant) {
      throw new GraphQLError("Forbidden", {
        extensions: { code: "FORBIDDEN" },
      });
    }
  }
}
