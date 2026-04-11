import express from "express";
import path from "path";
import { ApolloServer } from "apollo-server/node_modules/apollo-server-express";
import { schema } from "./graphql/schema";
import { createContext } from "./graphql/context";
import { ERROR_CODES } from "./common/errors";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "apollo-server-core";

export const createApp = async () => {
  const app = express();
  const sandboxAssetsPath = path.join(
    process.cwd(),
    "node_modules",
    "@apollo",
    "sandbox",
  );

  const server = new ApolloServer({
    schema,
    context: createContext,
    introspection: true,

    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            graphRef: "my-graph-id@my-graph-variant",
            footer: false,
          })
        : ApolloServerPluginLandingPageLocalDefault({
            footer: false,
            embed: true,
          }),
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

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });
  app.use("/sandbox-assets", express.static(sandboxAssetsPath));

  if (process.env.NODE_ENV !== "production") {
    app.get("/graphql", (_req, res) => {
      res.redirect("/sandbox");
    });
  }

  app.get("/health", (_req, res) => {
    res.json({ message: "Server running" });
  });

  return app;
};
