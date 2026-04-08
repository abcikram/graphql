import { RefreshTokenModel } from "./refreshToken.model";

export class RefreshTokenRepository {
  async create(data: any) {
    return RefreshTokenModel.create(data);
  }

  async findByToken(token: string) {
    return RefreshTokenModel.findOne({ token });
  }

  async delete(token: string) {
    return RefreshTokenModel.deleteOne({ token });
  }

  async deleteByUser(userId: string) {
    return RefreshTokenModel.deleteMany({ userId });
  }
}
