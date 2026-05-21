import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || "3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",

  JWT_SECRET: process.env.JWT_SECRET || "access_fallback",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_fallback",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  AI_SERVICE_KEY: process.env.AI_SERVICE_KEY || "ai_service_fallback",
} as const;
