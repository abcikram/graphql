import mongoose, { Model, Schema } from "mongoose";
import {
  ConversationType,
  IConversation,
} from "../interface/chat.interface";

const participantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

const conversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: Object.values(ConversationType),
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    participants: {
      type: [participantSchema],
      validate: {
        validator: (participants: unknown[]) => participants.length >= 2,
        message: "Conversation must have at least two participants",
      },
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

conversationSchema.index({ "participants.userId": 1, updatedAt: -1 });
conversationSchema.index({ type: 1, "participants.userId": 1 });

conversationSchema.set("toJSON", {
  transform: (_doc: unknown, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

export const ConversationModel: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema);
