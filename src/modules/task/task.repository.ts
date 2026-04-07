import { BaseRepository } from "../../common/repository/base.repository";
import { CreateTaskArgs, ITask } from "./interface/task.interface";
import { TaskModel } from "./model/task.model";

export interface ITaskRepository {
  create(data: CreateTaskArgs): Promise<ITask>;
  findAll(): Promise<ITask[]>;
  findById(id: string): Promise<ITask | null>;
  findByUser(userId: string): Promise<ITask[]>;
}

export class TaskRepository  extends BaseRepository<ITask> implements ITaskRepository  {
  constructor() {
    super(TaskModel);
  }

  async create(data: Partial<CreateTaskArgs> | ITask): Promise<ITask> {
    try {
      const task = new TaskModel(data);
      return await task.save();
    } catch (error) {
      throw new Error('Failed to create task');
    }
  }

  async findAll() {
    return TaskModel.find().sort({ createdAt: -1 }).lean();
  }

  async findById(id: string) {
    return TaskModel.findById(id).lean();
  }

  async findByUser(userId: string) {
    return TaskModel.find({
      assignedTo: userId,
    }).lean();
  }
}
