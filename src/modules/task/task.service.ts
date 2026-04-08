import { Types } from "mongoose";
import { ERROR_CODES, throwError } from "../../common/errors";
import { encodeCursor } from "../../utils/cursor";
import { CreateTaskArgs, ITask } from "./interface/task.interface";
import { TaskRepository } from "./task.repository";

export class TaskService {
  constructor(private taskRepo: TaskRepository) {}

  async createTask(input: CreateTaskArgs, userId: string): Promise<ITask> {
    try {
      if (!userId) {
        throwError("UNAUTHENTICATED", ERROR_CODES.UNAUTHENTICATED);
      }
      return this.taskRepo.create({
        title: input.title,
        assignedTo: input.assignedTo,
        createdBy: new Types.ObjectId(userId),
      });
    } catch (error: any) {
      throw new Error("Failed to create task");
    }
  }

  async getTasksPaginated(first: number, after?: string) {
    const result = await this.taskRepo.paginate({}, first, after);

    const edges = result.data.map((task: any) => ({
        node: {
            ...task,
            id: task._id.toString(),
        },
      cursor: encodeCursor(task._id.toString()),
    }));

    return {
      edges,
      pageInfo: result.pageInfo,
    };
  }
}
