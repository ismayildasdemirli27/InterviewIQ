import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { env } from "./env";

mongoose.set("bufferCommands", false);

let memoryServerInstance: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 2500,
    });

    console.log(
      `✅ MongoDB connected successfully: ${connection.connection.host}`
    );
  } catch (error) {
    console.warn(
      "⚠️ External MongoDB unreachable. Launching embedded in-memory database for testing..."
    );

    if (process.env.VERCEL) {
      console.warn("⚠️ Running in Vercel serverless mode. Skipping in-memory MongoDB spawn.");
      return;
    }

    try {
      if (!memoryServerInstance) {
        memoryServerInstance = await MongoMemoryServer.create();
      }

      const memoryUri = memoryServerInstance.getUri();
      const connection = await mongoose.connect(memoryUri);

      console.log(
        `✅ Embedded In-Memory MongoDB connected: ${connection.connection.host}`
      );
    } catch (fallbackError) {
      console.error(
        "❌ Failed to start both standard and embedded MongoDB:",
        fallbackError
      );
      if (process.env.VERCEL) {
        console.warn("⚠️ Running in serverless mode without active MongoDB connection.");
        return;
      }
      throw error;
    }
  }
};