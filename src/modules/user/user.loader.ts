import DataLoader from "dataloader";
import { UserModel } from "./model/user.model";

export const createUserLoader = () =>
  new DataLoader(async (ids: readonly string[]) => {
    const users = await UserModel.find({
      _id: { $in: ids },
    });

    const map = new Map(users.map((u) => [u.id, u]));

    return ids.map((id) => map.get(id));
  });
