// src/socket/socket.emitter.ts
import { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../constants/events.constants";

// 🎯 FIX LỖI: Định kiểu cấu trúc tường minh cho từng User trong mảng Snapshot Online bốc từ Backend
export interface SessionJoinAckUser {
  userId: string;
  fullName: string;
  role: "TEACHER" | "STUDENT" | string;
  joinedAt: string;
}

// 🎯 FIX LỖI: Định kiểu cấu trúc gói tin Phản hồi Acknowledgment chuẩn chỉ, loại bỏ "any"
export interface SessionJoinAck {
  success: boolean;
  message?: string;
  onlineUsers?: SessionJoinAckUser[];
}

export const socketEmitter = {
  /**
   * Giáo viên / Học sinh gửi lệnh gia nhập phòng học kèm cổng Callback bốc Snapshot Online thực tế
   */
  emitSessionJoin: (
    socket: Socket,
    sessionId: string,
    // ✅ FIX CHỐT: Thay thế 'ack: any' bằng Type 'ack: SessionJoinAck' chuẩn khế ước
    callback?: (ack: SessionJoinAck) => void,
  ) => {
    socket.emit(SOCKET_EVENTS.SESSION_JOIN, { sessionId }, callback);
  },

  /**
   * Người dùng chủ động thoát phòng học
   */
  emitSessionLeave: (socket: Socket, sessionId: string) => {
    socket.emit(SOCKET_EVENTS.SESSION_LEAVE, { sessionId });
  },

  /**
   * Gửi tin nhắn trao đổi trong phòng học công khai
   */
  emitChatSend: (socket: Socket, sessionId: string, message: string) => {
    socket.emit(SOCKET_EVENTS.CHAT_SEND, { sessionId, message });
  },
  // ==================== 🛠️ PHÂN KHU WEBRTC SIGNALING EMITTERS ====================

  /**
   * Chủ động gửi đề nghị kết nối thiết lập luồng truyền truyền thông
   */
  emitWebRTCOffer: (
    socket: Socket,
    payload: {
      sessionId: string;
      targetUserId: string;
      signal: RTCSessionDescriptionInit;
    },
  ) => {
    socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, payload);
  },

  /**
   * Trả lời chấp thuận kết nối từ đầu xa gửi tới
   */
  emitWebRTCAnswer: (
    socket: Socket,
    payload: {
      sessionId: string;
      targetUserId: string;
      signal: RTCSessionDescriptionInit;
    },
  ) => {
    socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, payload);
  },

  /**
   * Gửi ứng viên mạng ICE Candidate để đục tường lửa kết nối P2P local 3-4 máy
   */
  emitWebRTCIce: (
    socket: Socket,
    payload: {
      sessionId: string;
      targetUserId: string;
      signal: RTCIceCandidateInit;
    },
  ) => {
    socket.emit(SOCKET_EVENTS.WEBRTC_ICE, payload);
  },
};
