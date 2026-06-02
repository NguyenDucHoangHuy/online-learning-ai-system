import { createServer } from "http";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./prisma/client";
import { initSocketServer } from "./sockets/socket.server";

const httpServer = createServer(app);

// Khởi tạo Socket.IO gắn vào cùng HTTP server
initSocketServer(httpServer);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    // httpServer.listen(env.PORT, () => {
    //   console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    //   console.log(`📦 Environment: ${env.NODE_ENV}`);
    // });
    httpServer.listen(Number(env.PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`🌐 LAN URL: http://192.168.1.14:${env.PORT}`);
      console.log(`📦 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
