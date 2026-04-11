import DataLoader from "dataloader";
import { IUser } from "../../modules/user/model/user.model";

interface IContextUser {
  id: string;
  roleIds: string[];
}

export interface GraphQLContext {
  user?: IContextUser;
  loaders: {
    userLoader: DataLoader<string, IUser>;
  };
}
