import { Document, Types } from "mongoose";

export enum ITaskStatus {
    TODO = "TODO",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  status: ITaskStatus;
}

export interface CreateTaskArgs {
  title: string;
  assignedTo: string;
}

export interface TasksArgs {
  first: number;
  after?: string;
}