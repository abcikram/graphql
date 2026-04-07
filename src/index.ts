import { ApolloServer } from "apollo-server";
import { typeDefs, resolvers } from "./graphql/schema";
import { createContext } from "./graphql/context";
import { ERROR_CODES } from "./common/errors";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "apollo-server-core";

 
export const createServer = () => {
  return new ApolloServer({
    typeDefs,
    resolvers,
    context: createContext, 
    introspection: true, 

    plugins: [ 
      // Install a landing page plugin based on NODE_ENV
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            graphRef: "my-graph-id@my-graph-variant",
            footer: false,
          })
        : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ],

    formatError: (formattedError) => {
      if (
        formattedError.extensions.code === ERROR_CODES.INTERNAL_SERVER_ERROR
      ) {
        return {
          message: "Something went wrong",
          code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        };
      }
      return formattedError;
    },
  });
};
