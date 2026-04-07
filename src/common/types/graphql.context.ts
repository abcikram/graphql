import DataLoader from "dataloader";
import { IUser } from "../../modules/user/model/user.model";


export interface GraphQLContext {
  user?: IUser;
  loaders: {
    userLoader: DataLoader<string, IUser>;
  };
}
