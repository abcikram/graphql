import { IncomingMessage } from "http";
import { verifyToken } from "../modules/auth/auth.utils";

export const createContext = ({ req }: { req: IncomingMessage }) => {
  let user = null;

  const token = req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    try {
      user = verifyToken(token);
    } catch {
      user = null;
    }
  }

  return {
    req,
    user,
    loaders: {},
  };
};
