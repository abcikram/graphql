import { createServer } from "./index";
import { ENV } from "./config/env";
import { DatabaseManager } from "./database/DatabaseManager";

async function startServer() {
  const db = DatabaseManager.getInstance();

  await db.connect();

  const server = createServer();

  const { url } = await server.listen(ENV.PORT);

  console.log(`Server ready at ${url}`);
}

startServer();
