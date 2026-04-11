import { createApp } from "./index";
import { ENV } from "./config/env";
import { DatabaseManager } from "./database/DatabaseManager";
import { logger } from "./common/utils/logger";

async function startServer() {
  const db = DatabaseManager.getInstance();

  await db.connect();

  const app = await createApp();

  app.listen(ENV.PORT, () => {
    logger.info(`Server ready at http://localhost:${ENV.PORT}/graphql`);
    logger.info(`Sandbox ready at http://localhost:${ENV.PORT}/sandbox`);
  });
}

startServer();
