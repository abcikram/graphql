import { authorize } from "../../common/middleware/authorize";
import { GraphQLContext } from "../../common/types/graphql.context";
import { authService } from "../../container/auth.container";

import { LoginInput, SignupInput } from "./auth.types";


export const authResolvers = {
  Mutation: {
    signup: (_: unknown, { input }: { input: SignupInput }) =>
      authService.signup(input),
    login: (_: unknown, { input }: { input: LoginInput }) =>
      authService.login(input),
    logout: (_: unknown, { token }: { token: string }) =>
      authService.logout(token),
    logoutAll: (_: unknown, __: unknown, context: GraphQLContext) => {
      authorize([])(context);
      return authService.logoutAll(context?.user?.id!);
    },
    refreshToken: async (_: unknown, { token }: { token: string }) => {
      const payload = await authService.refreshToken(token);
      return payload;
    },
  },
};
