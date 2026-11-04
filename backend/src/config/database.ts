import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

let isConnected = false;

export async function connectDatabase(): Promise<typeof mongoose> {
  if (isConnected) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = conn.connections[0].readyState === 1;
    logger.info("MongoDB connected successfully", {
      host: conn.connection.host,
      name: conn.connection.name,
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
      isConnected = false;
    });

    return conn;
  } catch (error: any) {
    logger.error("Failed to connect to MongoDB", { error: error.message });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info("MongoDB connection closed");
}

