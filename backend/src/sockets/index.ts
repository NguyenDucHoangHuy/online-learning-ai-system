import { SOCKET_EVENTS } from "./socket.events";
import { CustomServer, CustomSocket } from "./socket.types";
import { registerChatHandlers } from "./handlers/chat.handler";
import { registerSessionHandlers } from "./handlers/session.handler";
import { registerWebRTCHandlers } from "./handlers/webrtc.handler";

export const registerSocketHandlers = (io: CustomServer) => {
  io.on("connection", (socket: CustomSocket) => {
    const { id, role } = socket.data.user;

    console.log(`🔌 Connected: ${id} (${role}) — socketId: ${socket.id}`);

    // Auto-join personal room ngay khi connect
    if (role === "TEACHER") {
      socket.join(`teacher:${id}`);
    } else if (role === "STUDENT") {
      socket.join(`student:${id}`);
    }

    // Đăng ký handlers theo nhóm
    registerChatHandlers(io, socket);
    registerSessionHandlers(io, socket);
    registerWebRTCHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${id} — socketId: ${socket.id}`);
      // Socket.IO tự xóa socket khỏi tất cả rooms khi disconnect
      // Không cần gọi leave thủ công
    });
  });
};
