import dotenv from "dotenv";
dotenv.config();

export const env = {
  // Server
  PORT: process.env.PORT || "3000",
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "fallback_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
} as const;