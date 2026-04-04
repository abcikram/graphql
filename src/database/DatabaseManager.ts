import { MongoDatabase, IDatabase } from "./mongoDatabase";

export class DatabaseManager {
  private static instance: IDatabase;

  static getInstance(): IDatabase {
    if (!this.instance) {
      this.instance = new MongoDatabase();
    }
    return this.instance;
  }
}
