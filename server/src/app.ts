import path from "node:path";
import fs from "node:fs";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env";
import { globalLimiter } from "./middleware/rateLimitMiddleware";
import { errorHandler, notFound } from "./middleware/errorMiddleware";

import authRoutes from "./routes/authRoutes";
import questionRoutes from "./routes/questionRoutes";
import interviewRoutes from "./routes/interviewRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import progressRoutes from "./routes/progressRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import bookmarkRoutes from "./routes/bookmarkRoutes";
import csAutomationRoutes from "./routes/csAutomationRoutes";
import healthController from "./controllers/healthController";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const allowedOrigins = [
  env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".trycloudflare.com") ||
        origin.endsWith(".onrender.com")
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "CORS policy violation: Access denied"
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.get("/health", healthController);
app.get("/api/v1/health", healthController);

app.use(
  "/api/v1",
  globalLimiter
);

app.use(
  "/api/v1/auth",
  authRoutes
);

app.use(
  "/api/v1/cs-automation",
  csAutomationRoutes
);

app.use(
  "/api/v1",
  questionRoutes
);

app.use(
  "/api/v1",
  interviewRoutes
);

app.use(
  "/api/v1",
  dashboardRoutes
);

app.use(
  "/api/v1",
  progressRoutes
);

app.use(
  "/api/v1",
  resumeRoutes
);

app.use(
  "/api/v1",
  bookmarkRoutes
);

const clientDistPath = fs.existsSync(path.resolve(process.cwd(), "client/dist"))
  ? path.resolve(process.cwd(), "client/dist")
  : path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api/")) {
      res.sendFile(path.join(clientDistPath, "index.html"));
      return;
    }
    next();
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;