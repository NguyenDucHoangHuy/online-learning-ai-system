import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../config/env";
import { socketAuthMiddleware } from "./socket.auth";
import { registerSocketHandlers } from "./index";

let _io: Server;

export const initSocketServer = (httpServer: HttpServer): Server => {
  const allowedOrigins = env.CLIENT_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  _io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log("🔌 Initializing Socket.IO server...");

  // Middleware JWT auth
  _io.use((socket, next) => {
    console.log(`🛰️ Incoming socket connection — socketId: ${socket.id}`);

    socketAuthMiddleware(socket, (err) => {
      if (err) {
        console.log(
          `❌ Socket auth failed — socketId: ${socket.id} — reason: ${err.message}`,
        );
        return next(err);
      }

      console.log(`✅ Socket authenticated — socketId: ${socket.id}`);

      next();
    });
  });

  // Register handlers
  registerSocketHandlers(_io);

  // Engine-level logs
  _io.engine.on("connection_error", (err) => {
    console.error("❌ Socket connection error:", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  console.log("✅ Socket.IO server initialized");

  return _io;
};

export const getIO = (): Server => {
  if (!_io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return _io;
};
