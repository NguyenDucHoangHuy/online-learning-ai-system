// src/sockets/handlers/webrtc.handler.ts
import { Role, JoinStatus, SessionStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { CustomServer, CustomSocket } from "../socket.types";
import { SOCKET_EVENTS } from "../socket.events";
import { emitSocketError } from "../utils/socket-error.util";

interface WebRTCSignalPayload {
  sessionId: string;
  targetUserId: string;
  signal: any; // Chứa RTCSessionDescriptionInit hoặc RTCIceCandidateInit từ Frontend
}

interface PeerAccessResult {
  allowed: boolean;
  targetRole?: Role;
}

const verifyPeerConnectionAccess = async (
  io: CustomServer,
  sessionId: string,
  senderId: string,
  targetId: string,
): Promise<PeerAccessResult> => {
  const roomSockets = await io.in(`session:${sessionId}`).fetchSockets();
  const isTargetOnlineInRoom = roomSockets.some(
    (s) => s.data.user.id === targetId,
  );

  if (!isTargetOnlineInRoom) {
    return { allowed: false };
  }

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: true,
      participants: {
        where: {
          studentId: { in: [senderId, targetId] },
          joinStatus: JoinStatus.APPROVED,
        },
      },
    },
  });

  if (!session || session.status !== SessionStatus.ACTIVE) {
    return { allowed: false };
  }

  const teacherId = session.class.teacherId;
  const approvedStudentIds = session.participants.map((p) => p.studentId);

  const isSenderValid =
    senderId === teacherId || approvedStudentIds.includes(senderId);
  const isTargetValid =
    targetId === teacherId || approvedStudentIds.includes(targetId);

  if (!isSenderValid || !isTargetValid) {
    return { allowed: false };
  }

  const targetRole = targetId === teacherId ? Role.TEACHER : Role.STUDENT;

  return { allowed: true, targetRole };
};

export const registerWebRTCHandlers = (
  io: CustomServer,
  socket: CustomSocket,
) => {
  // Bốc danh tính và Role đã được xác thực an toàn ở Middleware gác cổng
  const { id: userId, role: senderRole } = socket.data.user;

  const relaySignal = async (
    event: (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS],
    data: WebRTCSignalPayload,
  ) => {
    try {
      const { sessionId, targetUserId, signal } = data;

      const access = await verifyPeerConnectionAccess(
        io,
        sessionId,
        userId,
        targetUserId,
      );

      if (!access.allowed || !access.targetRole) {
        return emitSocketError(
          socket,
          `WebRTC Signaling: Access denied or peer offline`,
        );
      }

      const targetRoom =
        access.targetRole === Role.TEACHER
          ? `teacher:${targetUserId}`
          : `student:${targetUserId}`;

      // 📡 FIX VẤN ĐỀ 2: Gửi kèm fromRole xác thực gốc từ Server, cấm Client suy đoán mò
      socket.to(targetRoom).emit(event, {
        fromUserId: userId,
        fromRole: senderRole,
        signal,
        sessionId,
      });
    } catch {
      emitSocketError(socket, `Signaling process failed for event: ${event}`);
    }
  };

  socket.on(SOCKET_EVENTS.WEBRTC_OFFER, (data: WebRTCSignalPayload) =>
    relaySignal(SOCKET_EVENTS.WEBRTC_OFFER, data),
  );
  socket.on(SOCKET_EVENTS.WEBRTC_ANSWER, (data: WebRTCSignalPayload) =>
    relaySignal(SOCKET_EVENTS.WEBRTC_ANSWER, data),
  );
  socket.on(SOCKET_EVENTS.WEBRTC_ICE, (data: WebRTCSignalPayload) =>
    relaySignal(SOCKET_EVENTS.WEBRTC_ICE, data),
  );
};
