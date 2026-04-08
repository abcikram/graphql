# GraphQL Service

This project is a Node.js + Apollo Server + MongoDB GraphQL API.

Current modules:
- `auth`
- `user`
- `task`
- `chat`

The chat module supports:
- 1:1 chat
- group chat
- read receipts
- typing indicators
- cursor-based pagination
- GraphQL subscriptions
- Redis Pub/Sub for multi-instance real-time fanout

## Run the project

Install dependencies:

```bash
yarn install
```

Add environment variables:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/graphql-chat
JWT_SECRET=your_secret
REDIS_URL=redis://127.0.0.1:6379
```

Start the server:

```bash
yarn dev
```

Build the project:

```bash
yarn build
```

## High-Level Architecture

Each module follows this flow:

1. `schema.ts`
   Defines GraphQL types, queries, mutations, and subscriptions.
2. `resolver.ts`
   Receives GraphQL request data and forwards work to the service layer.
3. `service.ts`
   Contains business logic, validation, authorization, and workflow rules.
4. `repository.ts` / `model.ts`
   Talks to MongoDB using Mongoose.

For chat specifically:

1. Client sends GraphQL query/mutation/subscription.
2. Resolver reads `args` and `context.user`.
3. Service validates the user and conversation membership.
4. Repository reads/writes MongoDB.
5. For real-time events, service publishes to Redis Pub/Sub.
6. Active subscription listeners receive the event.

## Resolver Flow Explained

GraphQL resolver signature:

```ts
(parent, args, context, info)
```

Meaning:
- `parent`: result returned by the previous resolver
- `args`: input passed from the query or mutation
- `context`: shared request data like logged-in user and loaders
- `info`: GraphQL execution metadata

### Example: query resolver

From [chat.resolver.ts](./src/modules/chat/chat.resolver.ts):

```ts
conversations: (_: unknown, args: UserConversationsArgs, context: GraphQLContext) => {
  return chatService.getUserConversations(
    context.user?.id!,
    args.first,
    args.after,
  );
}
```

Flow:
- `args.first` and `args.after` come from the GraphQL query
- `context.user.id` comes from the JWT token in the request header
- resolver calls service
- service checks auth and fetches conversations for that user

### Example: field resolver

```ts
Message: {
  sender: (parent, _, context) => {
    return context.loaders.userLoader.load(String(parent.senderId));
  },
}
```

Flow:
- `parent` is the current message object
- `parent.senderId` is used to load the sender user
- DataLoader prevents N+1 queries

### Example: subscription resolver

```ts
messageSent: {
  subscribe: (_: unknown, { conversationId }: { conversationId: string }) => {
    return chatService.messageIterator(conversationId);
  },
}
```

Flow:
- client subscribes to a conversation
- resolver creates an async iterator for that conversation topic
- when `sendMessage` is called, the service publishes an event
- subscribers receive the new message in real time

## Chat Module Flow

### 1. Create conversation

Mutation:
- `createDirectConversation(participantId: ID!)`
- `createGroupConversation(title: String!, participantIds: [ID!]!)`

What happens:
- resolver forwards input to service
- service validates current user
- service checks users exist
- service creates or reuses conversation
- MongoDB stores participants and metadata

### 2. Send message

Mutation:
- `sendMessage(conversationId: ID!, content: String!, clientMessageId: String)`

What happens:
- resolver sends input to service
- service confirms user is a participant
- service supports idempotency using `clientMessageId`
- message is stored in MongoDB
- conversation `lastMessageId` and `lastMessageAt` are updated
- event is published through Redis Pub/Sub
- `messageSent` subscription receives it

### 3. Read receipt

Mutation:
- `markConversationRead(conversationId: ID!, messageId: ID!)`

What happens:
- service checks conversation membership
- service verifies the message belongs to that conversation
- participant read state is updated
- matching messages update `readBy`
- delivery state can move to `READ`

### 4. Typing indicator

Mutation:
- `publishTypingIndicator(conversationId: ID!, isTyping: Boolean!)`

What happens:
- user sends typing status
- service validates membership
- typing event is published
- subscribers on `typingIndicator` receive it

### 5. Pagination

Queries:
- `conversations(first: Int!, after: String)`
- `conversationMessages(conversationId: ID!, first: Int!, after: String)`

What happens:
- API returns `edges` + `pageInfo`
- `endCursor` is used as the next `after` value
- this avoids offset pagination problems on large datasets

## Chat APIs and What They Do

### Queries

#### `conversations(first, after)`

Use:
- list logged-in user conversations

Returns:
- conversation list
- last message info
- unread count
- pagination cursor

#### `conversation(id)`

Use:
- get one conversation by id

Returns:
- conversation metadata
- participants
- last message data

#### `conversationMessages(conversationId, first, after)`

Use:
- fetch paginated messages of one conversation

Returns:
- messages ordered by cursor
- sender
- read receipts
- pagination info

### Mutations

#### `createDirectConversation(participantId)`

Use:
- create or fetch a 1:1 chat with another user

#### `createGroupConversation(title, participantIds)`

Use:
- create a group chat

#### `sendMessage(conversationId, content, clientMessageId)`

Use:
- send a chat message

Important:
- `clientMessageId` helps retry safely without creating duplicate messages

#### `markConversationRead(conversationId, messageId)`

Use:
- mark messages as read up to a selected message

#### `publishTypingIndicator(conversationId, isTyping)`

Use:
- notify active subscribers that the user started or stopped typing

### Subscriptions

#### `messageSent(conversationId)`

Use:
- listen for new messages in one conversation

#### `typingIndicator(conversationId)`

Use:
- listen for typing events in one conversation

## How Redis Pub/Sub Is Used

Chat subscriptions use Redis when `REDIS_URL` is configured.

Flow:
- `sendMessage` publishes a Redis event
- `publishTypingIndicator` publishes a Redis event
- every server instance subscribed to that topic receives the event
- GraphQL subscription clients connected to any instance get notified

Why this helps:
- works across multiple Node.js instances
- better than in-memory pub/sub for scaled deployments

Important:
- Redis Pub/Sub is real-time fanout
- it is not durable event storage
- for guaranteed retry/replay, Kafka or a queue is the next step

## How To Test Chat APIs

Use Apollo Sandbox or any GraphQL client.

Add auth header:

```http
Authorization: Bearer <access_token>
```

### Step 1: create users / login

Use existing auth APIs:
- `signup`
- `login`

Keep two user tokens for testing:
- User A token
- User B token

### Step 2: create direct conversation

```graphql
mutation CreateDirectConversation($participantId: ID!) {
  createDirectConversation(participantId: $participantId) {
    id
    type
    participants {
      user {
        id
        name
      }
    }
  }
}
```

Variables:

```json
{
  "participantId": "USER_B_ID"
}
```

Expected:
- returns a `DIRECT` conversation

### Step 3: subscribe to new messages

Open a second GraphQL tab and run:

```graphql
subscription OnMessage($conversationId: ID!) {
  messageSent(conversationId: $conversationId) {
    id
    content
    createdAt
    sender {
      id
      name
    }
  }
}
```

Variables:

```json
{
  "conversationId": "CONVERSATION_ID"
}
```

Expected:
- subscription stays active and waits for events

### Step 4: send message

From another tab:

```graphql
mutation SendMessage($conversationId: ID!, $content: String!, $clientMessageId: String) {
  sendMessage(
    conversationId: $conversationId
    content: $content
    clientMessageId: $clientMessageId
  ) {
    id
    content
    deliveryStatus
    createdAt
  }
}
```

Variables:

```json
{
  "conversationId": "CONVERSATION_ID",
  "content": "Hello from user A",
  "clientMessageId": "msg-001"
}
```

Expected:
- mutation returns saved message
- active `messageSent` subscription receives the same message

### Step 5: test message list pagination

```graphql
query Messages($conversationId: ID!, $first: Int!, $after: String) {
  conversationMessages(conversationId: $conversationId, first: $first, after: $after) {
    edges {
      cursor
      node {
        id
        content
        createdAt
        sender {
          id
          name
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Variables:

```json
{
  "conversationId": "CONVERSATION_ID",
  "first": 10
}
```

To fetch next page:
- copy `pageInfo.endCursor`
- send it as `after`

### Step 6: test read receipts

```graphql
mutation ReadConversation($conversationId: ID!, $messageId: ID!) {
  markConversationRead(conversationId: $conversationId, messageId: $messageId)
}
```

Expected:
- returns `true`
- future reads of messages show updated `readBy`

### Step 7: test typing indicator

Open subscription:

```graphql
subscription OnTyping($conversationId: ID!) {
  typingIndicator(conversationId: $conversationId) {
    conversationId
    isTyping
    emittedAt
    user {
      id
      name
    }
  }
}
```

Then publish typing event:

```graphql
mutation Typing($conversationId: ID!, $isTyping: Boolean!) {
  publishTypingIndicator(conversationId: $conversationId, isTyping: $isTyping)
}
```

Variables:

```json
{
  "conversationId": "CONVERSATION_ID",
  "isTyping": true
}
```

Expected:
- subscription receives typing event immediately

## End-to-End Chat Test Order

Recommended order:

1. `signup` or `login` two users
2. `createDirectConversation`
3. `messageSent` subscription
4. `sendMessage`
5. `conversationMessages`
6. `markConversationRead`
7. `typingIndicator` subscription
8. `publishTypingIndicator`

## Which File Handles What

Chat files:
- `src/modules/chat/chat.schema.ts`: GraphQL chat types and operations
- `src/modules/chat/chat.resolver.ts`: GraphQL resolvers
- `src/modules/chat/chat.service.ts`: business logic
- `src/modules/chat/chat.repository.ts`: MongoDB access
- `src/modules/chat/model/conversation.model.ts`: conversation schema
- `src/modules/chat/model/message.model.ts`: message schema
- `src/modules/chat/chat.pubsub.ts`: Redis Pub/Sub and fallback in-memory pub/sub
- `src/container/chat.container.ts`: dependency wiring

Shared files:
- `src/graphql/schema.ts`: merges module schemas/resolvers
- `src/graphql/context.ts`: builds request context and current user
- `src/modules/user/user.loader.ts`: DataLoader for user fields

## Notes

- Subscriptions currently publish chat events through Redis Pub/Sub when `REDIS_URL` is set.
- If `REDIS_URL` is missing, the app falls back to in-memory pub/sub for local development.
- For stronger delivery guarantees, retries, and offline replay, add Kafka or a persistent queue later.
