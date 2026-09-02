

import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

const startServer = async (): Promise<void> => {
  try {
    console.log("🚀 Starting InterviewIQ Server...");
    await connectDB();

    app.listen(env.PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${env.PORT}`);

      if (env.NODE_ENV === "development") {
        console.log(`Local URL: http://localhost:${env.PORT}`);
      }
    });
  } catch (error) {
    console.error("Server start error:", error);
    process.exit(1);
  }
};

void startServer();