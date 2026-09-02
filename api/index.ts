import app from "../server/src/app";
import { connectDB } from "../server/src/config/db";

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Root serverless handler error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error connecting to database.",
    });
  }
}
