import { IncomingMessage } from "http";
import { verifyToken } from "../modules/auth/auth.utils";
import { createUserLoader } from "../modules/user/user.loader";
import { GraphQLError } from "graphql";

export const createContext = ({ req }: { req: IncomingMessage }) => {
  const authHeader = req.headers.authorization || "";

  let user = null;

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    try {
      user = verifyToken(token);
    } catch (err) {
      throw new GraphQLError("Invalid token", {
        extensions: { code: "UNAUTHENTICATED" },
      });
    }
  }

  return {
    req,
    user,
    loaders: {
      userLoader: createUserLoader(),
    },
  };
};
