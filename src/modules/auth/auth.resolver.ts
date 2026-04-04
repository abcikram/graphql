
import { authService } from "../../container/auth.container";

import { LoginInput, SignupInput } from "./auth.types";


export const authResolvers = {
  Mutation: {
    signup: (_: unknown, { input }: { input: SignupInput }) =>
      authService.signup(input),
    login: (_: unknown, { input }: { input: LoginInput }) =>
      authService.login(input),
  },
};
