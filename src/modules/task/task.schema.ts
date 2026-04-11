import { gql } from "apollo-server";

export const taskTypeDefs = gql`
  type Task {
    id: ID
    title: String
    assignedTo: User
    createdBy: User
    createdAt: String
  }

  type TaskEdge {
    node: Task!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    tasks(first: Int!, after: String): TaskConnection!
      @auth(action: READ, resource: TASK)
  }
  extend type Mutation {
    createTask(title: String!, assignedTo: ID!): Task!
      @auth(action: CREATE, resource: TASK)
  }
`;
