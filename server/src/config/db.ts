import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { env } from "./env";

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1 || isConnected) {
    return;
  }

  try {
    const connection = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;

    console.log(
      `✅ MongoDB connected successfully: ${connection.connection.host}`
    );
  } catch (error) {
    console.warn(
      `⚠️ MongoDB connection to "${env.MONGO_URI}" failed. Initializing persistent local database for testing...`
    );

    try {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const dbPath = path.resolve(process.cwd(), ".mongo-data");
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }

      const mongod = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: "wiredTiger",
        },
      });
      const uri = mongod.getUri();
      const connection = await mongoose.connect(uri);
      isConnected = true;

      console.log(
        `✅ Connected to Persistent Local MongoDB (${uri}) with storage at ${dbPath}`
      );
    } catch (memError) {
      console.warn("Retrying MongoMemoryServer in standard memory mode...", memError);
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      isConnected = true;
      console.log(`✅ Connected to In-Memory MongoDB (${uri})`);
    }
  }
};