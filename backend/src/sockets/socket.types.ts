import { Server, Socket } from "socket.io";
import { Role } from "@prisma/client";

export interface SocketUser {
  id: string;
  role: Role;
}

export interface CustomSocket extends Socket {
  data: {
    user: SocketUser;
  };
}

export type CustomServer = Server;

// Ack response format dùng chung toàn hệ thống
export interface SocketAck<T = undefined> {
  success: boolean;
  data?: T;
  message?: string;
}
