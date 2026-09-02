

import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import { warmupLocalModel } from "./services/aiProviderService";
import { User } from "./models/User";

const seedDefaultUsers = async (): Promise<void> => {
  try {
    const existing = await User.findOne({ email: "ismayildasdemirli01@gmail.com" });
    if (!existing) {
      await User.create({
        fullName: "İsmayıl Daşdəmirli",
        email: "ismayildasdemirli01@gmail.com",
        password: "19981998isi",
        role: "admin",
        isEmailVerified: true,
        authProvider: "local",
      });
      console.log("✅ Seeded default admin: ismayildasdemirli01@gmail.com");
    }
  } catch (err: any) {
    console.warn("Could not seed default user:", err.message);
  }
};

const startServer = async (): Promise<void> => {
  try {
    console.log("🚀 Starting InterviewIQ Server...");
    await connectDB();
    await seedDefaultUsers();

    // Pre-warm local GPU LLM in the background so all user requests are instantaneous
    warmupLocalModel().catch(() => {});

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