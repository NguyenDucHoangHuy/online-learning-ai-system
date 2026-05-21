import { Socket } from "socket.io";
import { jwtUtil } from "../common/utils/jwt.util";
import { Role } from "@prisma/client";

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  try {
    const raw = socket.handshake.auth?.token as string | undefined;

    if (!raw) {
      return next(new Error("Authentication token is required"));
    }

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

    const payload = jwtUtil.verifyAccessToken(token);

    socket.data.user = {
      id: payload.id,
      role: payload.role as Role,
    };

    next();
  } catch (error: any) {
    // Phân biệt token hết hạn vs token không hợp lệ
    // giúp Frontend biết cần silent refresh hay redirect login
    if (error?.name === "TokenExpiredError") {
      return next(new Error("Token expired"));
    }

    next(new Error("Invalid token"));
  }
};
