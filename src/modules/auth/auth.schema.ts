import { gql } from "apollo-server";

export const authTypeDefs = gql`
  enum Role {
    USER
    ADMIN
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
  }

  input SignupInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  extend type Mutation {
    signup(input: SignupInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
  }
`;
