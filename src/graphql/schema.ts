import { gql } from "apollo-server";
import { authTypeDefs } from "../modules/auth/auth.schema";
import { authResolvers } from "../modules/auth/auth.resolver";
import { userResolvers } from "../modules/user/user.resolver";
import { taskTypeDefs } from "../modules/task/task.schema";
import { taskResolvers } from "../modules/task/task.resolver";
import { userTypeDefs } from "../modules/user/user.schema";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import {
  authDirectiveTransformer,
  authDirectiveTypeDefs,
} from "./directives/auth.directive";

const baseTypeDefs = gql`
  enum PermissionAction {
    CREATE
    READ
    UPDATE
    DELETE
  }

  enum PermissionResource {
    USER
    TASK
    POST
    COMMENT
  }

  type Query {
    health: String!
  } 

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = mergeTypeDefs([
  baseTypeDefs,
  authDirectiveTypeDefs,
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

const executableSchema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export const schema = authDirectiveTransformer(executableSchema);
