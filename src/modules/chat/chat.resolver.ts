import { GraphQLContext } from "../../common/types/graphql.context";
import { chatService } from "../../container/chat.container";
import { IUser } from "../user/model/user.model";
import {
  ConversationArgs,
  ConversationMessagesArgs,
  CreateGroupConversationArgs,
  MarkConversationReadArgs,
  PublishTypingIndicatorArgs,
  SendMessageArgs,
  UserConversationsArgs,
} from "./interface/chat.interface";

export const chatResolvers = {
  Query: {
    conversations: (
      _: unknown,
      args: UserConversationsArgs,
      context: GraphQLContext,
    ) => {
      return chatService.getUserConversations(
        context.user?.id!,
        args.first,
        args.after,
      );
    },
    conversation: (
      _: unknown,
      args: ConversationArgs,
      context: GraphQLContext,
    ) => {
      return chatService.getConversationById(args.id, context.user?.id!);
    },
    conversationMessages: (
      _: unknown,
      args: ConversationMessagesArgs,
      context: GraphQLContext,
    ) => {
      return chatService.getConversationMessages(
        context.user?.id!,
        args.conversationId,
        args.first,
        args.after,
      );
    },
  },
  Mutation: {
    createDirectConversation: (
      _: unknown,
      { participantId }: { participantId: string },
      context: GraphQLContext,
    ) => chatService.createDirectConversation(context.user?.id!, participantId),
    createGroupConversation: (
      _: unknown,
      args: CreateGroupConversationArgs,
      context: GraphQLContext,
    ) => chatService.createGroupConversation(context.user?.id!, args),
    sendMessage: (
      _: unknown,
      args: SendMessageArgs,
      context: GraphQLContext,
    ) => chatService.sendMessage(context.user?.id!, args),
    markConversationRead: (
      _: unknown,
      args: MarkConversationReadArgs,
      context: GraphQLContext,
    ) => chatService.markConversationRead(context.user?.id!, args),
    publishTypingIndicator: (
      _: unknown,
      args: PublishTypingIndicatorArgs,
      context: GraphQLContext,
    ) => chatService.publishTypingIndicator(context.user?.id!, args),
  },
  Subscription: {
    messageSent: {
      subscribe: (
        _: unknown,
        { conversationId }: { conversationId: string },
        context: GraphQLContext,
      ) => {
        return chatService.messageIterator(conversationId);
      },
    },
    typingIndicator: {
      subscribe: (
        _: unknown,
        { conversationId }: { conversationId: string },
        context: GraphQLContext,
      ) => {
        return chatService.typingIterator(conversationId);
      },
    },
  },
  Conversation: {
    unreadCount: (parent: any, _: unknown, context: GraphQLContext) =>
      chatService.getUnreadCount(parent, context.user?.id!),
    lastMessage: async (parent: any) => {
      if (!parent.lastMessageId) {
        return null;
      }
      return chatService.getMessageById(String(parent.lastMessageId));
    },
  },
  ConversationParticipant: {
    user: (parent: any, _: unknown, context: GraphQLContext): Promise<IUser> =>
      context.loaders.userLoader.load(String(parent.userId)),
  },
  Message: {
    sender: (parent: any, _: unknown, context: GraphQLContext): Promise<IUser> =>
      context.loaders.userLoader.load(String(parent.senderId)),
    conversationId: (parent: any) => String(parent.conversationId),
  },
  MessageReadReceipt: {
    user: (parent: any, _: unknown, context: GraphQLContext): Promise<IUser> =>
      context.loaders.userLoader.load(String(parent.userId)),
  },
  TypingIndicatorEvent: {
    user: (parent: any, _: unknown, context: GraphQLContext): Promise<IUser> =>
      context.loaders.userLoader.load(String(parent.userId)),
  },
};
