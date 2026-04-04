import { gql } from "apollo-server";
import { authTypeDefs } from "../modules/auth/auth.schema";
import { authResolvers } from "../modules/auth/auth.resolver";
import { userResolvers } from "../modules/user/user.resolver";

import { userTypeDefs } from "../modules/user/user.schema";

const baseTypeDefs = gql`
  type Query {
    health: String!
  } 

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [baseTypeDefs, authTypeDefs, userTypeDefs];

export const resolvers = {
  Query: {
    health: () => "Server running",
    ...userResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
  },
};
