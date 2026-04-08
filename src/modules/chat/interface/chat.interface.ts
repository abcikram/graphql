import { Document, Types } from "mongoose";

export enum ConversationType {
  DIRECT = "DIRECT",
  GROUP = "GROUP",
}

export enum MessageDeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

export interface IConversationParticipant {
  userId: Types.ObjectId;
  joinedAt: Date;
  lastReadMessageId?: Types.ObjectId | null;
  lastReadAt?: Date | null;
}

export interface IConversation extends Document {
  type: ConversationType;
  title?: string;
  participants: IConversationParticipant[];
  createdBy: Types.ObjectId;
  lastMessageId?: Types.ObjectId | null;
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDeliveryAttempt {
  status: MessageDeliveryStatus;
  attemptedAt: Date;
  error?: string;
}

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  clientMessageId?: string;
  deliveryStatus: MessageDeliveryStatus;
  deliveryAttempts: IMessageDeliveryAttempt[];
  readBy: Array<{
    userId: Types.ObjectId;
    readAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationArgs {
  id: string;
}

export interface ConversationMessagesArgs {
  conversationId: string;
  first: number;
  after?: string;
}

export interface UserConversationsArgs {
  first: number;
  after?: string;
}

export interface CreateDirectConversationArgs {
  participantId: string;
}

export interface CreateGroupConversationArgs {
  title: string;
  participantIds: string[];
}

export interface SendMessageArgs {
  conversationId: string;
  content: string;
  clientMessageId?: string;
}

export interface MarkConversationReadArgs {
  conversationId: string;
  messageId: string;
}

export interface PublishTypingIndicatorArgs {
  conversationId: string;
  isTyping: boolean;
}
