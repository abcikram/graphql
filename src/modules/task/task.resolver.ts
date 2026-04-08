import { authorize } from "../../common/middleware/authorize";
import { taskService } from "../../container/task.container";
import { GraphQLContext } from "../../common/types/graphql.context";
import { ITask, CreateTaskArgs, TasksArgs } from "./interface/task.interface";
import { IUser } from "../user/model/user.model";

export const taskResolvers = {
  Query: {
    tasks: async (_: unknown, args: TasksArgs, context: GraphQLContext) => {
      return taskService.getTasksPaginated(args.first, args.after);
    },
  },

  Mutation: {
    createTask: async (
      _: unknown,
      { title, assignedTo }: CreateTaskArgs,
      context: GraphQLContext,
    ): Promise<ITask> => {
      authorize(["ADMIN"])(context);
      return taskService.createTask({ title, assignedTo }, context?.user?.id!);
    },
  },

  Task: {
    assignedTo: async (
      parent: ITask,
      _: unknown,
      context: GraphQLContext,
    ): Promise<IUser> => {
      return context.loaders.userLoader.load(parent.assignedTo.toString());
    },

    createdBy: async (
      parent: ITask,
      _: unknown,
      context: GraphQLContext,
    ): Promise<IUser> => {
      return context.loaders.userLoader.load(parent.createdBy.toString());
    },
  },
};