import mongoose, { Model, Schema } from "mongoose";
import {
  IMessage,
  MessageDeliveryStatus,
} from "../interface/chat.interface";

const readBySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
);

const deliveryAttemptSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(MessageDeliveryStatus),
      required: true,
    },
    attemptedAt: {
      type: Date,
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { _id: false },
);

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    clientMessageId: {
      type: String,
      index: true,
      sparse: true,
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(MessageDeliveryStatus),
      default: MessageDeliveryStatus.SENT,
    },
    deliveryAttempts: {
      type: [deliveryAttemptSchema],
      default: [],
    },
    readBy: {
      type: [readBySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

messageSchema.index({ conversationId: 1, _id: 1 });
messageSchema.index({ conversationId: 1, clientMessageId: 1 }, { unique: true, sparse: true });

messageSchema.set("toJSON", {
  transform: (_doc: unknown, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const MessageModel: Model<IMessage> =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", messageSchema);
