import mongoose from "mongoose";
import { IPermission } from "./permission.interface";

export interface IRole {
  role: string;
  roleDisplayName: string;
  permissions: Array<mongoose.Types.ObjectId | IPermission>;
}
