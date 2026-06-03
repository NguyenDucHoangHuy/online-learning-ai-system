// src/sockets/handlers/session.handler.ts
import { JoinStatus, Role } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { CustomServer, CustomSocket } from "../socket.types";
import { SOCKET_EVENTS } from "../socket.events";

export const registerSessionHandlers = (
  io: CustomServer,
  socket: CustomSocket,
) => {
  const { id: userId, role } = socket.data.user;

  // ==================== JOIN ROOM ====================
  socket.on(
    SOCKET_EVENTS.SESSION_JOIN,
    async (
      data: { sessionId: string },
      // 🎯 NÂNG CẤP KHẾ ƯỚC: Trả thêm mảng snapshot danh sách những người THỰC SỰ ONLINE
      callback: (ack: {
        success: boolean;
        message?: string;
        onlineUsers?: any[];
      }) => void,
    ) => {
      try {
        const { sessionId } = data;
        const roomName = `session:${sessionId}`;

        // Kiểm tra quyền truy cập dưới DB trước khi cho phép vào phòng Socket
        let userInfo: { id: string; fullName: string; role: Role };

        if (role === "TEACHER") {
          const session = await prisma.classSession.findFirst({
            where: {
              id: sessionId,
              status: "ACTIVE",
              class: { teacherId: userId },
            },
            include: {
              class: {
                include: {
                  teacher: { select: { id: true, fullName: true, role: true } },
                },
              },
            },
          });
          if (!session)
            return callback({
              success: false,
              message: "Session not found or access denied",
            });
          userInfo = session.class.teacher;
        } else {
          const participant = await prisma.sessionParticipant.findFirst({
            where: {
              sessionId,
              studentId: userId,
              joinStatus: JoinStatus.APPROVED,
              session: { status: "ACTIVE" },
            },
            include: {
              student: { select: { id: true, fullName: true, role: true } },
            },
          });
          if (!participant)
            return callback({ success: false, message: "Access denied" });
          userInfo = participant.student;
        }

        // Vào phòng Socket chung của lớp học
        await socket.join(roomName);

        // 🎯 CHIẾN THUẬT SNAPSHOT: Quét sạch các Socket đang online thực tế trong phòng này
        const socketsInRoom = await io.in(roomName).fetchSockets();

        // Thu thập toàn bộ User ID của các thiết bị đang online
        const onlineUserIds = socketsInRoom.map((s) => (s as any).data.user.id);

        // Bốc nhanh thông tin FullName từ DB lên để đóng gói thành Payload sạch gửi về cho người vừa F5
        const onlineProfiles = await prisma.user.findMany({
          where: { id: { in: onlineUserIds } },
          select: { id: true, fullName: true, role: true },
        });

        const onlineUsersPayload = onlineProfiles.map((u) => ({
          userId: u.id,
          fullName: u.fullName,
          role: u.role,
          joinedAt: new Date().toISOString(),
        }));

        // Bắn tin báo danh cho những người cũ đang ngồi sẵn trong phòng
        socket.to(roomName).emit(`${SOCKET_EVENTS.PARTICIPANT_JOINED}:room`, {
          userId: userInfo.id,
          fullName: userInfo.fullName,
          role: userInfo.role,
          joinedAt: new Date().toISOString(),
        });

        // 🎯 CHỐT HẠ: Trả ngược Snapshot danh sách Online về cho thiết bị vừa Join/F5 qua Callback Ack
        callback({ success: true, onlineUsers: onlineUsersPayload });
      } catch (error: any) {
        callback({
          success: false,
          message: error?.message || "Failed to join room",
        });
      }
    },
  );

  // ==================== LEAVE ROOM ====================
  socket.on(
    SOCKET_EVENTS.SESSION_LEAVE,
    (
      data: { sessionId: string },
      callback?: (ack: { success: boolean }) => void,
    ) => {
      try {
        const { sessionId } = data;
        const roomName = `session:${sessionId}`;

        // ✅ Anti-spam: không trong phòng thì không cần leave
        if (!socket.rooms.has(roomName)) {
          return callback?.({ success: true });
        }

        socket.leave(roomName);

        // ✅ socket.to() — exclude sender, chỉ notify những người còn lại trong lớp học
        socket.to(roomName).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, {
          userId,
          role, // Tự động bốc từ session data
          leftAt: new Date().toISOString(),
        });

        callback?.({ success: true });
      } catch {
        callback?.({ success: false });
      }
    },
  );

  socket.on(
    SOCKET_EVENTS.MEDIA_STATE,
    (data: { sessionId: string; isMuted: boolean; isVideoOff: boolean }) => {
      const { sessionId, isMuted, isVideoOff } = data;
      const roomName = `session:${sessionId}`;

      if (!socket.rooms.has(roomName)) return;

      socket.to(roomName).emit(SOCKET_EVENTS.MEDIA_STATE, {
        userId,
        role,
        isMuted,
        isVideoOff,
        updatedAt: new Date().toISOString(),
      });
    },
  );
};
