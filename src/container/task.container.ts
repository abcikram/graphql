import { TaskRepository } from "../modules/task/task.repository";
import { TaskService } from "../modules/task/task.service";


const taskRepository = new TaskRepository();

export const taskService = new TaskService(taskRepository);
