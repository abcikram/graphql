import { Types } from "mongoose";
import { BaseRepository } from "../../common/repository/base.repository";
import {
  ConversationType,
  IConversation,
  IMessage,
  MessageDeliveryStatus,
} from "./interface/chat.interface";
import { ConversationModel } from "./model/conversation.model";
import { MessageModel } from "./model/message.model";

export class ChatRepository extends BaseRepository<IConversation> {
  constructor() {
    super(ConversationModel);
  }

  async findConversationById(id: string) {
    return ConversationModel.findById(id);
  }

  async findDirectConversationByParticipants(participantIds: Types.ObjectId[]) {
    return ConversationModel.findOne({
      type: ConversationType.DIRECT,
      participants: {
        $size: participantIds.length,
        $all: participantIds.map((participantId) => ({ $elemMatch: { userId: participantId } })),
      },
    });
  }

  async createConversation(data: Partial<IConversation>) {
    return ConversationModel.create(data);
  }

  async paginateConversationsForUser(userId: string, limit: number, after?: string) {
    return this.paginate(
      { "participants.userId": new Types.ObjectId(userId) },
      limit,
      after,
      "_id",
      1,
    );
  }

  async createMessage(data: Partial<IMessage>) {
    return MessageModel.create(data);
  }

  async findMessageByClientMessageId(conversationId: string, clientMessageId: string) {
    return MessageModel.findOne({ conversationId, clientMessageId });
  }

  async findMessageById(id: string) {
    return MessageModel.findById(id);
  }

  async paginateMessages(conversationId: string, limit: number, after?: string) {
    return new BaseRepository<IMessage>(MessageModel).paginate(
      { conversationId: new Types.ObjectId(conversationId) },
      limit,
      after,
      "_id",
      1,
    );
  }

  async updateConversationAfterMessage(
    conversationId: Types.ObjectId,
    messageId: Types.ObjectId,
    messageCreatedAt: Date,
  ) {
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        lastMessageId: messageId,
        lastMessageAt: messageCreatedAt,
      },
    });
  }

  async markConversationRead(
    conversationId: string,
    userId: string,
    messageId: string,
    readAt: Date,
  ) {
    await ConversationModel.updateOne(
      {
        _id: conversationId,
        "participants.userId": userId,
      },
      {
        $set: {
          "participants.$.lastReadMessageId": new Types.ObjectId(messageId),
          "participants.$.lastReadAt": readAt,
        },
      },
    );

    await MessageModel.updateMany(
      {
        conversationId,
        _id: { $lte: new Types.ObjectId(messageId) },
        "readBy.userId": { $ne: new Types.ObjectId(userId) },
      },
      {
        $push: {
          readBy: {
            userId: new Types.ObjectId(userId),
            readAt,
          },
        },
        $set: {
          deliveryStatus: MessageDeliveryStatus.READ,
        },
      },
    );
  }
}
