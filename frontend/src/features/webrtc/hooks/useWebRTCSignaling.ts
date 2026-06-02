// src/features/webrtc/hooks/useWebRTCSignaling.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../constants/events.constants";
import { PeerManager } from "../utils/peer.manager";

interface WebRTCSignalingProps {
  socket: Socket | null;
  isConnected: boolean;
  sessionId: string;
  currentUserId: string;
  currentUserRole: "TEACHER" | "STUDENT";
  localStream: MediaStream | null;
}

// 🎯 FIX VẤN ĐỀ 2: Cập nhật Interface nhận diện khế ước sạch từ Server bắn sang
interface IncomingSignalPayload {
  fromUserId: string;
  fromRole: "TEACHER" | "STUDENT"; // Chuẩn hóa kiểu an toàn
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export function useWebRTCSignaling({
  socket,
  isConnected,
  sessionId,
  currentUserId,
  currentUserRole,
  localStream,
}: WebRTCSignalingProps) {
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream>
  >({});
  const peerManagerRef = useRef<PeerManager | null>(null);

  // Khởi tạo lõi quản lý kết nối cố định
  useEffect(() => {
    if (!socket || !sessionId) return;

    peerManagerRef.current = new PeerManager(
      socket,
      sessionId,
      currentUserId,
      currentUserRole,
      (targetUserId, stream) => {
        setRemoteStreams((prev) => ({ ...prev, [targetUserId]: stream }));
      },
    );

    return () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.clearAllConnections();
        peerManagerRef.current = null;
      }
    };
  }, [socket, sessionId, currentUserId, currentUserRole]);

  // 🎯 FIX VẤN ĐỀ 1: Theo dõi biến động localStream để nạp động vào PeerManager ngay khi camera bật xong
  useEffect(() => {
    if (peerManagerRef.current && localStream) {
      peerManagerRef.current.updateLocalStream(localStream);
    }
  }, [localStream]);

  // LUỒNG LẮNG NGHE SỰ KIỆN SIGNALING VÀ ỦY THÁC PHÂN PHỐI
  useEffect(() => {
    if (!socket || !isConnected || !sessionId || !peerManagerRef.current)
      return;

    const manager = peerManagerRef.current;

    socket.on(
      SOCKET_EVENTS.WEBRTC_OFFER,
      async (payload: IncomingSignalPayload) => {
        const { fromUserId, fromRole, signal } = payload;
        console.log(
          `📥 [Signaling] Nhận OFFER từ: ${fromUserId} (${fromRole})`,
        );
        await manager.handleIncomingOffer(
          fromUserId,
          fromRole,
          signal as RTCSessionDescriptionInit,
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.WEBRTC_ANSWER,
      async (payload: IncomingSignalPayload) => {
        const { fromUserId, signal } = payload;
        await manager.handleIncomingAnswer(
          fromUserId,
          signal as RTCSessionDescriptionInit,
        );
      },
    );

    socket.on(
      SOCKET_EVENTS.WEBRTC_ICE,
      async (payload: IncomingSignalPayload) => {
        const { fromUserId, signal } = payload;
        await manager.handleIncomingIce(
          fromUserId,
          signal as RTCIceCandidateInit,
        );
      },
    );

    // 🎯 FIX VẤN ĐỀ 4: Nghe ngóng tin có thành viên out lớp học để tiến hành cắt tỉa đơn luồng kết nối phần cứng
    socket.on(
      SOCKET_EVENTS.PARTICIPANT_LEFT,
      (payload: { userId: string; role: string }) => {
        console.log(
          `🧹 [Signaling Engine] Nhận tin User ${payload.userId} rời phòng học. Kích hoạt dọn dẹp đơn luồng...`,
        );
        manager.removeConnection(payload.userId);

        // Xóa văng Stream ra khỏi radar State hiển thị UI của React
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
      },
    );

    return () => {
      socket.off(SOCKET_EVENTS.WEBRTC_OFFER);
      socket.off(SOCKET_EVENTS.WEBRTC_ANSWER);
      socket.off(SOCKET_EVENTS.WEBRTC_ICE);
      socket.off(SOCKET_EVENTS.PARTICIPANT_LEFT);
    };
  }, [socket, isConnected, sessionId]);

  // 🎯 FIX VẤN ĐỀ 5: Hàm kích nổ cuộc gọi công khai ra ngoài UI
  const initiateCall = useCallback(
    (targetUserId: string, targetUserRole: "TEACHER" | "STUDENT") => {
      if (peerManagerRef.current) {
        peerManagerRef.current.createAndSendOffer(targetUserId, targetUserRole);
      }
    },
    [],
  );

  return { remoteStreams, initiateCall };
}
