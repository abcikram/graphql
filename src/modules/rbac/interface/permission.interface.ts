export enum PermissionAction {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

export enum PermissionResource {
  USER = "user",
  TASK = "task",
  POST = "post",
  COMMENT = "comment",
}

export interface IPermission {
  action: PermissionAction;
  resource: PermissionResource;
}
