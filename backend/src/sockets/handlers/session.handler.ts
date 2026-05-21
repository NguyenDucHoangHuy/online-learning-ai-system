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
      callback: (ack: { success: boolean; message?: string }) => void,
    ) => {
      try {
        const { sessionId } = data;
        const roomName = `session:${sessionId}`;

        // ✅ Anti-spam: đã trong phòng rồi thì không join lại
        if (socket.rooms.has(roomName)) {
          return callback({ success: true });
        }

        let userInfo: { id: string; fullName: string; role: Role };

        // ✅ Gộp query — 1 lần DB duy nhất cho mỗi role
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
                  teacher: {
                    select: { id: true, fullName: true, role: true },
                  },
                },
              },
            },
          });

          if (!session) {
            return callback({
              success: false,
              message: "Session not found or access denied",
            });
          }

          userInfo = session.class.teacher;
        } else {
          const participant = await prisma.sessionParticipant.findFirst({
            where: {
              sessionId,
              studentId: userId,
              joinStatus: JoinStatus.APPROVED,
              session: {
                status: "ACTIVE",
              },
            },
            include: {
              student: {
                select: { id: true, fullName: true, role: true },
              },
            },
          });

          if (!participant) {
            return callback({ success: false, message: "Access denied" });
          }

          userInfo = participant.student;
        }

        // Join session room
        await socket.join(roomName);

        // ✅ socket.to() thay vì io.to() — exclude sender tránh self-event
        socket.to(roomName).emit(SOCKET_EVENTS.PARTICIPANT_JOINED, {
          userId: userInfo.id,
          fullName: userInfo.fullName,
          role: userInfo.role,
          joinedAt: new Date().toISOString(),
        });

        callback({ success: true });
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

        // ✅ socket.to() — exclude sender, chỉ notify những người còn lại
        socket.to(roomName).emit(SOCKET_EVENTS.PARTICIPANT_LEFT, {
          userId,
          role,
          leftAt: new Date().toISOString(),
        });

        callback?.({ success: true });
      } catch {
        callback?.({ success: false });
      }
    },
  );
};
