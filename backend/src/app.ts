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
import chatRoutes from "./modules/chat/chat.route";
import emotionRoutes from "./modules/emotions/emotions.route";

import { errorMiddleware } from "./common/middleware/error.middleware";
import { notFoundMiddleware } from "./common/middleware/not-found.middleware";

const app = express();

app.use(helmet());

const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api", sessionsRoutes);
app.use("/api", participantsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/emotions", emotionRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
