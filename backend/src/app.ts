import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./common/middleware/error.middleware";

const app = express();

// ==================== MIDDLEWARE ====================
app.use(helmet());
app.use(
  cors({
    origin: env.NODE_ENV === "development" ? "*" : process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== HEALTH CHECK ====================
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== ROUTES (sẽ thêm sau) ====================
// app.use('/api/auth', authRouter);

// ==================== ERROR HANDLING ====================
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
