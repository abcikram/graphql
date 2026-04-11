import mongoose, { Schema } from "mongoose";
import { IRole } from "../interface/role.interface";

const roleSchema = new Schema<IRole>({
  role: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  roleDisplayName: {
    type: String,
    required: true,
  },
  permissions: [
    {
      type: Schema.Types.ObjectId,
      ref: "Permission",
    },
  ],
}, { timestamps: true });

export const RoleModel = mongoose.model<IRole>("Role", roleSchema);
