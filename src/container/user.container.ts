
import { UserRepository } from "../modules/user/user.repository";
import { UserService } from "../modules/user/user.service";

const userRepository = new UserRepository();

export const userService = new UserService(userRepository);
