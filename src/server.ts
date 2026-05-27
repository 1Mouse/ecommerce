import { env } from "./config/env.ts";
import {
  connectMongo,
  disconnectMongo,
} from "./infrastructure/database/mongodb.ts";
import { app } from "./app.ts";

await connectMongo(env.mongodbUri);

const server = app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`${signal} received. Shutting down...`);

  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }

    await disconnectMongo();
    process.exit();
  });
}

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});

process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});
