import { JoinStatus, SessionStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import {
  chatService,
  ChatMessageWithUser,
} from "../../modules/chat/chat.service";
import { sendMessageSchema } from "../../modules/chat/chat.dto";
import { CustomServer, CustomSocket, SocketAck } from "../socket.types";
import { SOCKET_EVENTS } from "../socket.events";
import { emitToSession } from "../utils/emit.util";

export const registerChatHandlers = (
  io: CustomServer,
  socket: CustomSocket,
) => {
  const { id: userId, role } = socket.data.user;

  socket.on(
    SOCKET_EVENTS.CHAT_SEND,
    async (
      data: { sessionId: string; message: string },
      callback: (ack: SocketAck<ChatMessageWithUser>) => void,
    ) => {
      try {
        const { sessionId } = data;

        // 1. Validate message
        const parsed = sendMessageSchema.parse({ message: data.message });

        // 2 & 3. Verify quyền + session status — mỗi role 1 query duy nhất
        if (role === "TEACHER") {
          const session = await prisma.classSession.findFirst({
            where: {
              id: sessionId,
              class: { teacherId: userId }, // ownership check trong where
            },
          });

          if (!session || session.status !== SessionStatus.ACTIVE) {
            return callback({
              success: false,
              message: "Session is not active or not found",
            });
          }
        } else {
          const participant = await prisma.sessionParticipant.findFirst({
            where: {
              sessionId,
              studentId: userId,
              joinStatus: JoinStatus.APPROVED,
            },
            include: { session: true },
          });

          if (
            !participant ||
            participant.session.status !== SessionStatus.ACTIVE
          ) {
            return callback({
              success: false,
              message: "Access denied or session not active",
            });
          }
        }

        // 4. Lưu DB
        const savedMessage = await chatService.sendMessage(
          sessionId,
          userId,
          parsed,
        );

        // 5. Broadcast cả phòng kể cả sender — dùng io.to() để sync canonical message từ DB
        emitToSession(io, sessionId, SOCKET_EVENTS.CHAT_NEW, savedMessage);

        // 6. Ack cho sender
        callback({ success: true, data: savedMessage });
      } catch (error: any) {
        callback({
          success: false,
          message: error?.message || "Failed to send message",
        });
      }
    },
  );
};
