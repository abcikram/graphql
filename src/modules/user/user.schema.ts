import { gql } from "apollo-server";

export const userTypeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    roleIds: [ID!]!
  }

  type UserEdge {
    cursor: String!
    node: User!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    users(limit: Int!, cursor: String): UserConnection!
      @auth(action: READ, resource: USER)
  }
`;
