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

    socket.on(
      SOCKET_EVENTS.SCREEN_SHARE_START,
      (payload: { sessionId?: string; fullName?: string }) => {
        if (!payload.sessionId) return;

        socket.to(`session:${payload.sessionId}`).emit(
          SOCKET_EVENTS.SCREEN_SHARE_START,
          {
            sessionId: payload.sessionId,
            userId: id,
            role,
            fullName: payload.fullName,
            startedAt: new Date().toISOString(),
          },
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.SCREEN_SHARE_FRAME,
      (payload: {
        sessionId?: string;
        image?: string;
        capturedAt?: string;
        fullName?: string;
      }) => {
        if (!payload.sessionId || !payload.image) return;

        socket.to(`session:${payload.sessionId}`).emit(
          SOCKET_EVENTS.SCREEN_SHARE_FRAME,
          {
            sessionId: payload.sessionId,
            userId: id,
            role,
            fullName: payload.fullName,
            image: payload.image,
            capturedAt: payload.capturedAt || new Date().toISOString(),
          },
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.SCREEN_SHARE_STOP,
      (payload: { sessionId?: string }) => {
        if (!payload.sessionId) return;

        socket.to(`session:${payload.sessionId}`).emit(
          SOCKET_EVENTS.SCREEN_SHARE_STOP,
          {
            sessionId: payload.sessionId,
            userId: id,
            role,
            stoppedAt: new Date().toISOString(),
          },
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.HAND_RAISE,
      (payload: { sessionId?: string; isRaised?: boolean; fullName?: string }) => {
        if (!payload.sessionId) return;

        socket.to(`session:${payload.sessionId}`).emit(SOCKET_EVENTS.HAND_RAISE, {
          sessionId: payload.sessionId,
          userId: id,
          role,
          fullName: payload.fullName,
          isRaised: Boolean(payload.isRaised),
          updatedAt: new Date().toISOString(),
        });
      },
    );

    socket.on("disconnecting", () => {
      socket.rooms.forEach((roomName) => {
        if (!roomName.startsWith("session:")) return;

        socket.to(roomName).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, {
          userId: id,
          role,
          leftAt: new Date().toISOString(),
        });

        socket.to(roomName).emit(SOCKET_EVENTS.SCREEN_SHARE_STOP, {
          sessionId: roomName.replace("session:", ""),
          userId: id,
          role,
          stoppedAt: new Date().toISOString(),
        });

        socket.to(roomName).emit(SOCKET_EVENTS.HAND_RAISE, {
          sessionId: roomName.replace("session:", ""),
          userId: id,
          role,
          isRaised: false,
          updatedAt: new Date().toISOString(),
        });
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${id} — socketId: ${socket.id}`);
      // Socket.IO tự xóa socket khỏi tất cả rooms khi disconnect
      // Không cần gọi leave thủ công
    });
  });
};
