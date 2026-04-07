import { gql } from "apollo-server";
import { authTypeDefs } from "../modules/auth/auth.schema";
import { authResolvers } from "../modules/auth/auth.resolver";
import { userResolvers } from "../modules/user/user.resolver";
import { taskTypeDefs } from "../modules/task/task.schema";
import { taskResolvers } from "../modules/task/task.resolver";

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
]);

export const resolvers = {
  Query: {
    health: () => "Server running",
    ...userResolvers.Query,
    ...taskResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...taskResolvers.Mutation,
  },
  Task: taskResolvers.Task,
};
