import { gql } from "apollo-server";
import { authTypeDefs } from "../modules/auth/auth.schema";
import { authResolvers } from "../modules/auth/auth.resolver";
import { userResolvers } from "../modules/user/user.resolver";
import { taskTypeDefs } from "../modules/task/task.schema";
import { taskResolvers } from "../modules/task/task.resolver";
import { chatTypeDefs } from "../modules/chat/chat.schema";
import { chatResolvers } from "../modules/chat/chat.resolver";

import { userTypeDefs } from "../modules/user/user.schema";
import { mergeTypeDefs } from "@graphql-tools/merge";

const baseTypeDefs = gql`
  type Query {
    health: String!
  } 

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = mergeTypeDefs([
  baseTypeDefs, 
  authTypeDefs,
  userTypeDefs,
  taskTypeDefs,
  chatTypeDefs,
]);

export const resolvers = {
  Query: {
    health: () => "Server running",
    ...userResolvers.Query,
    ...taskResolvers.Query,
    ...chatResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...chatResolvers.Mutation,
  },
  Subscription: {
    ...chatResolvers.Subscription,
  },
  Task: taskResolvers.Task,
  Conversation: chatResolvers.Conversation,
  ConversationParticipant: chatResolvers.ConversationParticipant,
  Message: chatResolvers.Message,
  MessageReadReceipt: chatResolvers.MessageReadReceipt,
  TypingIndicatorEvent: chatResolvers.TypingIndicatorEvent,
};
