import { SignupInput, LoginInput } from "./auth.types";

import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
} from "./auth.utils";

import { throwError, ERROR_CODES } from "../../common/errors";
import { UserRepository } from "../user/user.repository";

export interface IAuthService {
  signup(input: SignupInput): Promise<any>;
  login(input: LoginInput): Promise<any>;
}

export class AuthService implements IAuthService {
  constructor(private authRepo: UserRepository) {}

  async signup(input: SignupInput) {
    const { name, email, password } = input;

    if (!email || !password) {
      throwError("Invalid input", ERROR_CODES.BAD_USER_INPUT);
    }

    const existingUser = await this.authRepo.findByEmail(email);

    if (existingUser) {
      throwError("User already exists", ERROR_CODES.USER_ALREADY_EXISTS);
    }

    const hashed = await hashPassword(password);

    const user = await this.authRepo.create({
      name,
      email,
      password: hashed,
      role: "USER",
    });

    return this.generateTokens(user);
  }

  async login(input: LoginInput) {
    try {
      const { email, password } = input;

      const user = await this.authRepo.findByEmail(email);

      if (!user) {
        throwError("Invalid credentials", ERROR_CODES.UNAUTHENTICATED);
      }

      const isValid = await user?.comparePassword(password);

      if (!isValid) {
        throwError("Invalid credentials", ERROR_CODES.UNAUTHENTICATED);
      }

      return this.generateTokens(user);
    } catch (err) {
      console.error("Error during login:", err);
      throw err;
    }
  }

  private generateTokens(user: any) {
    const payload = { id: user.id, role: user.role };

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }
}
