import { AuthService } from "../modules/auth/auth.service";
import { RefreshTokenRepository } from "../modules/auth/refreshToken.repository";
import { UserRepository } from "../modules/user/user.repository";

const userRepository = new UserRepository();
const refreshTokenRepository = new RefreshTokenRepository();

export const authService = new AuthService(userRepository, refreshTokenRepository);
