import mongoose from "mongoose";
import { ENV } from "../config/env";
import { logger } from "../common/utils/logger";

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class MongoDatabase implements IDatabase {
  async connect(): Promise<void> {
    try {
      mongoose.set("strictQuery", true);

      await mongoose.connect(ENV.MONGO_URI);

      logger.info("MongoDB connected"); 

      this.registerEvents();
    } catch (error) {
      logger.error({ error }, "MongoDB connection failed");
      process.exit(1);
    }
  }

  async disconnect(): Promise<void> {
    await mongoose.connection.close();
    logger.info("MongoDB disconnected");
  }

  private registerEvents() {
    mongoose.connection.on("error", (err) => {
      logger.error({ err }, "MongoDB error");
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });
  }
}
