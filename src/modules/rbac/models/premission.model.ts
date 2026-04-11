import mongoose, { Schema } from "mongoose";
import { IPermission, PermissionAction, PermissionResource } from "../interface/permission.interface";


const permissionSchema = new Schema<IPermission>({
  action: {
    type: String,
    enum: Object.values(PermissionAction),
    required: true,
  },
  resource: {
    type: String,
    enum: Object.values(PermissionResource),
    required: true,
  }
});

export const PermissionModel = mongoose.model<IPermission>("Permission", permissionSchema);
