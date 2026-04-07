import mongoose, { Schema } from "mongoose";
import { ITask, ITaskStatus } from "../interface/task.interface";

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(ITaskStatus),
      default: ITaskStatus.TODO,
    },
  },
  { timestamps: true },
);

taskSchema.index({ title: 1, createdBy: 1 });

taskSchema.set("toJSON", {
  transform: (_: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});


export const TaskModel =
  mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);
