import { IUser, UserModel } from "./model/user.model";

export interface IUserRepository {
  findByEmail(email: string): Promise<IUser | null>;
  create(data: any): Promise<IUser>;
  findAllPaginated(limit: number, cursor?: string): Promise<IUser[]>;
}

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email });
  }

  async create(data: any): Promise<IUser> {
    return UserModel.create(data);
  }

  async findAllPaginated(limit: number, cursor?: string): Promise<IUser[]> {
    const query: any = {};

    if (cursor) {
      query._id = { $gt: cursor };
    }

    const users = await UserModel.find(query)
      .sort({ _id: 1 })
      .limit(limit + 1);

    return users;
  }
}
