import { Types } from "mongoose";
import { RoleModel } from "./models/role.model";
import { IUser } from "../user/model/user.model";

export class RBACService {
  async hasPermission(
    user: Pick<IUser, "_id" | "roleIds"> | { id?: string; roleIds?: string[] },
    action: string,
    resource: string,
  ) {
    if (!user) return false;

    const roleIds =
      "roleIds" in user && Array.isArray(user.roleIds)
        ? user.roleIds
        : [];

    if (!roleIds.length) return false;

    const roles = await RoleModel.find({
      _id: {
        $in: roleIds.map((roleId) =>
          typeof roleId === "string" ? new Types.ObjectId(roleId) : roleId,
        ),
      },
    }).populate("permissions");

    if (!roles.length) return false;

    return roles.some((role) =>
      role.permissions.some(
        (perm: any) => perm.action === action && perm.resource === resource,
      ),
    );
  }
}

export const rbacService = new RBACService();
