import mongoose from "mongoose";
import { sleep } from "../../shared/utils/sleep.ts";

const connectionStates: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function connectMongo(uri: string): Promise<void> {
  mongoose.set("strictQuery", true);

  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5_000,
      });

      console.log("MongoDB connected");
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `MongoDB connection failed. Retrying ${attempt}/${maxAttempts}...`,
      );
      await sleep(1_000);
    }
  }
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  console.log("MongoDB disconnected");
}

export function getMongoConnectionStatus(): string {
  return connectionStates[mongoose.connection.readyState] ?? "unknown";
}
