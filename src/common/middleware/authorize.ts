import { GraphQLError } from "graphql";
import { GraphQLContext } from "../types/graphql.context";

export const authorize = (roles: string[]) => {
  return (context: GraphQLContext) => {
    if (!context.user) {
      throw new GraphQLError("Unauthorized", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }

    if (!roles.includes(context.user.role)) {
      throw new GraphQLError("Forbidden", {
        extensions: { code: "FORBIDDEN" },
      });
    }
  };
};
