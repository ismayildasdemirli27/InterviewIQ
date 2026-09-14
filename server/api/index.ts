import "../src/utils/domPolyfill";
import "../src/types/expressUser";
import app from "../src/app";
import { connectDB } from "../src/config/db";
import { autoSeed } from "../src/scripts/autoSeed";

let isInitialized = false;

export default async function handler(req: any, res: any) {
  if (!isInitialized) {
    try {
      await connectDB();
      await autoSeed();
    } catch (e) {
      console.warn("⚠️ Serverless initialization warning:", e);
    }
    isInitialized = true;
  }

  return app(req, res);
}
