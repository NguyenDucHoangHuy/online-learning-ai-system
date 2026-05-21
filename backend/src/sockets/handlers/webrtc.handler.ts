import { Role, JoinStatus, SessionStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { CustomServer, CustomSocket } from "../socket.types";
import { SOCKET_EVENTS } from "../socket.events";
import { emitSocketError } from "../utils/socket-error.util";

// ✅ VẤN ĐỀ 3: Định nghĩa Payload Contract chặt chẽ theo cấu trúc chuẩn WebRTC
interface WebRTCSignalPayload {
  sessionId: string;
  targetUserId: string;
  signal: any; // Chứa RTCSessionDescriptionInit hoặc RTCIceCandidateInit từ Frontend
}

interface PeerAccessResult {
  allowed: boolean;
  targetRole?: Role;
}

// ✅ VẤN ĐỀ 1 & 4: Tự định đoạt Role từ DB + Quét sạch "Ghost Peer" khỏi room bằng fetchSockets
const verifyPeerConnectionAccess = async (
  io: CustomServer, // Cần truyền io vào để quét phòng socket
  sessionId: string,
  senderId: string,
  targetId: string,
): Promise<PeerAccessResult> => {
  // 1. Kiểm tra "Anti-room bypass": Thằng nhận có thực sự đang Online trong room socket này không?
  const roomSockets = await io.in(`session:${sessionId}`).fetchSockets();
  const isTargetOnlineInRoom = roomSockets.some(
    (s) => s.data.user.id === targetId,
  );

  if (!isTargetOnlineInRoom) {
    return { allowed: false }; // Thằng nhận offline hoặc chưa join room -> Chặn luôn
  }

  // 2. Chọc DB kiểm tra quyền (1 câu query tối ưu duy nhất)
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

  // 3. Tự sinh Role an toàn dựa trên dữ liệu DB gốc của hệ thống
  const targetRole = targetId === teacherId ? Role.TEACHER : Role.STUDENT;

  return {
    allowed: true,
    targetRole,
  };
};

export const registerWebRTCHandlers = (
  io: CustomServer,
  socket: CustomSocket,
) => {
  const { id: userId } = socket.data.user;

  // ✅ VẤN ĐỀ 2: Unify logic - Thiết lập bộ Relay trung chuyển tín hiệu dùng chung (DRY)
  const relaySignal = async (
    event: (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS],
    data: WebRTCSignalPayload,
  ) => {
    try {
      const { sessionId, targetUserId, signal } = data;

      // Xác thực an toàn tuyệt đối từ tầng lõi
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

      // Tuyệt đối không tin tưởng client, dùng targetRole do server tự tính toán
      const targetRoom =
        access.targetRole === Role.TEACHER
          ? `teacher:${targetUserId}`
          : `student:${targetUserId}`;

      // Bắn tín hiệu trúng đích
      socket.to(targetRoom).emit(event, {
        fromUserId: userId,
        signal,
        sessionId,
      });
    } catch {
      emitSocketError(socket, `Signaling process failed for event: ${event}`);
    }
  };

  // ==================== REGISTER EVENTS ====================

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
