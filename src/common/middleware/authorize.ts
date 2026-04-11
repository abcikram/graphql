import { GraphQLError } from "graphql";
import { GraphQLContext } from "../types/graphql.context";

export const authorize = (roles?: string[]) => {
  return (context: GraphQLContext) => {
    if (!context.user) {
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (roles && roles.length > 0) {
      throw new GraphQLError(
        "Static role-based authorization is no longer supported here. Use the @auth directive with RBAC permissions.",
        {
          extensions: { code: "FORBIDDEN" },
        },
      );
    }
  };
};
