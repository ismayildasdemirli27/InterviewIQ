import dotenv from "dotenv";

dotenv.config();

type NodeEnvironment =
  | "development"
  | "test"
  | "production";

interface EnvConfig {
  PORT: number;

  NODE_ENV: NodeEnvironment;

  MONGO_URI: string;

  JWT_SECRET: string;

  JWT_EXPIRES_IN: string;

  GEMINI_API_KEY?: string;

  CLIENT_URL: string;

  GOOGLE_CLIENT_ID: string;

  EMAILJS_SERVICE_ID: string;

  EMAILJS_TEMPLATE_ID: string;

  EMAILJS_RESET_TEMPLATE_ID: string;

  EMAILJS_PUBLIC_KEY: string;

  EMAILJS_PRIVATE_KEY?: string;

  /*
   * Optional custom ATS boards.
   *
   * Comma-separated slugs.
   *
   * Example:
   *
   * GREENHOUSE_BOARDS=stripe,airbnb
   * LEVER_BOARDS=whoop,veeva
   * ASHBY_BOARDS=linear,ramp
   *
   * If these are empty, InterviewIQ uses its built-in
   * default board list.
   */
  GREENHOUSE_BOARDS?: string;

  LEVER_BOARDS?: string;

  ASHBY_BOARDS?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function getRequiredEnv(
  name:
    string
): string {
  const value =
    process.env[
      name
    ];

  if (
    !value ||
    value.trim() ===
      ""
  ) {
    throw new Error(
      `CRITICAL ERROR: Environment variable "${name}" is missing or empty in .env file.`
    );
  }

  return value.trim();
}

function getOptionalEnv(
  name:
    string
): string | undefined {
  const value =
    process.env[
      name
    ]
      ?.trim();

  return (
    value ||
    undefined
  );
}

function parsePort(
  value:
    string | undefined
): number {
  if (
    !value ||
    value.trim() ===
      ""
  ) {
    return 5000;
  }

  const parsedPort =
    Number(
      value
    );

  if (
    Number.isNaN(
      parsedPort
    ) ||
    !Number.isInteger(
      parsedPort
    ) ||
    parsedPort <=
      0 ||
    parsedPort >
      65535
  ) {
    throw new Error(
      `CRITICAL ERROR: Invalid PORT value "${value}". PORT must be an integer between 1 and 65535.`
    );
  }

  return parsedPort;
}

function parseNodeEnvironment(
  value:
    string | undefined
): NodeEnvironment {
  const nodeEnv =
    value?.trim() ||
    "development";

  const allowedEnvironments:
    NodeEnvironment[] = [
      "development",
      "test",
      "production",
    ];

  if (
    !allowedEnvironments.includes(
      nodeEnv as NodeEnvironment
    )
  ) {
    throw new Error(
      `CRITICAL ERROR: Invalid NODE_ENV value "${nodeEnv}".`
    );
  }

  return nodeEnv as NodeEnvironment;
}

/* =========================================================
   CONFIG
========================================================= */

export const env:
  EnvConfig = {
  PORT:
    parsePort(
      process.env.PORT
    ),

  NODE_ENV:
    parseNodeEnvironment(
      process.env.NODE_ENV
    ),

  MONGO_URI:
    process.env.MONGO_URI?.trim() || "mongodb://127.0.0.1:27017/interviewiq",

  JWT_SECRET:
    process.env.JWT_SECRET?.trim() || "super_secret_interviewiq_jwt_token_key_2026",

  JWT_EXPIRES_IN:
    process
      .env
      .JWT_EXPIRES_IN
      ?.trim() ||
    "7d",

  GEMINI_API_KEY:
    getOptionalEnv(
      "GEMINI_API_KEY"
    ),

  CLIENT_URL:
    process
      .env
      .CLIENT_URL
      ?.trim() ||
    "http://localhost:5173",

  GOOGLE_CLIENT_ID:
    getOptionalEnv(
      "GOOGLE_CLIENT_ID"
    ) || "dummy_google_client_id",

  EMAILJS_SERVICE_ID:
    getOptionalEnv(
      "EMAILJS_SERVICE_ID"
    ) || "dummy_service_id",

  EMAILJS_TEMPLATE_ID:
    getOptionalEnv(
      "EMAILJS_TEMPLATE_ID"
    ) || "dummy_template_id",

  EMAILJS_RESET_TEMPLATE_ID:
    getOptionalEnv(
      "EMAILJS_RESET_TEMPLATE_ID"
    ) || "dummy_reset_template_id",

  EMAILJS_PUBLIC_KEY:
    getOptionalEnv(
      "EMAILJS_PUBLIC_KEY"
    ) || "dummy_public_key",

  EMAILJS_PRIVATE_KEY:
    getOptionalEnv(
      "EMAILJS_PRIVATE_KEY"
    ),

  GREENHOUSE_BOARDS:
    getOptionalEnv(
      "GREENHOUSE_BOARDS"
    ),

  LEVER_BOARDS:
    getOptionalEnv(
      "LEVER_BOARDS"
    ),

  ASHBY_BOARDS:
    getOptionalEnv(
      "ASHBY_BOARDS"
    ),
};