import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";

import authRoutes from "./modules/auth/auth.route";
import usersRoutes from "./modules/users/users.route";
import sessionsRoutes from "./modules/sessions/sessions.route";
import participantsRoutes from "./modules/participants/participants.route";
import classesRoutes from "./modules/classes/classes.route";

// thêm import
import chatRoutes from "./modules/chat/chat.route";
import emotionRoutes from "./modules/emotions/emotions.route";

import { errorMiddleware } from "./common/middleware/error.middleware";
import { notFoundMiddleware } from "./common/middleware/not-found.middleware";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_URL || "http://localhost:5173", // URL của Vite/React frontend
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ================= ROUTES =================

app.use("/api/auth", authRoutes);

app.use("/api/users", usersRoutes);

app.use("/api/classes", classesRoutes);
app.use("/api", sessionsRoutes);
app.use("/api", participantsRoutes);

// thêm routes mới
app.use("/api/chat", chatRoutes);

app.use("/api/emotions", emotionRoutes);

// ================= MIDDLEWARE =================

app.use(notFoundMiddleware);

app.use(errorMiddleware);

export default app;
