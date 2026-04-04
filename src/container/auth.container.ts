import { AuthService } from "../modules/auth/auth.service";
import { UserRepository } from "../modules/user/user.repository";

const userRepository = new UserRepository();

export const authService = new AuthService(userRepository);
