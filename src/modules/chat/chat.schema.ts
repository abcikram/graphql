import { gql } from "apollo-server";

export const chatTypeDefs = gql`
  enum ConversationType {
    DIRECT
    GROUP
  }

  enum MessageDeliveryStatus {
    PENDING
    SENT
    DELIVERED
    READ
    FAILED
  }

  type MessageReadReceipt {
    user: User!
    readAt: String!
  }

  type ConversationParticipant {
    user: User!
    joinedAt: String!
    lastReadAt: String
    lastReadMessageId: ID
  }

  type Message {
    id: ID!
    conversationId: ID!
    sender: User!
    content: String!
    clientMessageId: String
    deliveryStatus: MessageDeliveryStatus!
    readBy: [MessageReadReceipt!]!
    createdAt: String!
  }

  type Conversation {
    id: ID!
    type: ConversationType!
    title: String
    participants: [ConversationParticipant!]!
    lastMessage: Message
    lastMessageAt: String
    unreadCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type MessageEdge {
    node: Message!
    cursor: String!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
  }

  type ConversationEdge {
    node: Conversation!
    cursor: String!
  }

  type ConversationConnection {
    edges: [ConversationEdge!]!
    pageInfo: PageInfo!
  }

  type TypingIndicatorEvent {
    conversationId: ID!
    user: User!
    isTyping: Boolean!
    emittedAt: String!
  }

  extend type Query {
    conversations(first: Int!, after: String): ConversationConnection!
    conversation(id: ID!): Conversation!
    conversationMessages(conversationId: ID!, first: Int!, after: String): MessageConnection!
  }

  extend type Mutation {
    createDirectConversation(participantId: ID!): Conversation!
    createGroupConversation(title: String!, participantIds: [ID!]!): Conversation!
    sendMessage(conversationId: ID!, content: String!, clientMessageId: String): Message!
    markConversationRead(conversationId: ID!, messageId: ID!): Boolean!
    publishTypingIndicator(conversationId: ID!, isTyping: Boolean!): Boolean!
  }

  type Subscription {
    messageSent(conversationId: ID!): Message!
    typingIndicator(conversationId: ID!): TypingIndicatorEvent!
  }
`;
