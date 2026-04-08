import { UserRepository } from "../modules/user/user.repository";
import { ChatRepository } from "../modules/chat/chat.repository";
import { createChatPubSub } from "../modules/chat/chat.pubsub";
import { ChatService } from "../modules/chat/chat.service";

const chatRepository = new ChatRepository();
const userRepository = new UserRepository();
const chatPubSub = createChatPubSub();

export const chatService = new ChatService(
  chatRepository,
  userRepository,
  chatPubSub,
);
