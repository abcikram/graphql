import { userService } from "../../container/user.container";

export const userResolvers = {
  Query: {
    users: (
      _: unknown,
      { limit, cursor }: { limit: number; cursor: string },
    ) => {
      return userService.getUsers(limit, cursor);
    },
  },
};
