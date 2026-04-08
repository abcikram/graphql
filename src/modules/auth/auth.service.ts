import { SignupInput, LoginInput } from "./auth.types";

import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from "./auth.utils";

import { throwError, ERROR_CODES } from "../../common/errors";
import { UserRepository } from "../user/user.repository";
import { RefreshTokenRepository } from "./refreshToken.repository";

export interface IAuthService {
  signup(input: SignupInput): Promise<any>;
  login(input: LoginInput): Promise<any>;
}

export class AuthService implements IAuthService {
  constructor(
    private authRepo: UserRepository,
    private refreshRepo: RefreshTokenRepository,
  ) {}

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

      return await this.generateTokens(user);
    } catch (err) {
      console.error("Error during login:", err);
      throw err;
    }
  }

  private async generateTokens(user: any) {
    const payload = { id: user.id, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await this.refreshRepo.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(oldToken: string) {
    const stored = await this.refreshRepo.findByToken(oldToken);

    if (!stored) {
      throwError("Invalid refresh token", ERROR_CODES.UNAUTHENTICATED);
    }

    let payload;
    try {
      payload = verifyToken(oldToken);
    } catch {
      throwError("Invalid refresh token", ERROR_CODES.UNAUTHENTICATED);
    }

    await this.refreshRepo.delete(oldToken);

    return this.generateTokens(payload);
  }

  async logout(token: string) {
    await this.refreshRepo.delete(token);
    return true;
  }

  async logoutAll(userId: string) {
    try {
      await this.refreshRepo.deleteByUser(userId);
      return true;
    } catch (err) {   
      console.error("Error during logoutAll:", err);
      throw new Error("Failed to logout from all sessions");
    }
  }
}
