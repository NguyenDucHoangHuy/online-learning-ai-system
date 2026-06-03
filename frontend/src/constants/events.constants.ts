// src/constants/events.constants.ts

export const SOCKET_EVENTS = {
  // Phân hệ Chat phòng học
  CHAT_SEND: "chat:send",
  CHAT_NEW: "chat:new",

  // Vòng đời tham gia phòng học trực tuyến (Dành cho việc Join/Leave không gian WebRTC)
  SESSION_JOIN: "session:join",
  SESSION_LEAVE: "session:leave",
  SESSION_ENDED: "session:ended",
  MEDIA_STATE: "media:state",

  // Luồng Phê duyệt Phòng chờ (HTTP tác động -> Socket phát tín hiệu Real-time)
  PARTICIPANT_JOINED: "participant:joined",
  PARTICIPANT_LEFT: "participant:left",
  PARTICIPANT_APPROVED: "participant:approved",
  PARTICIPANT_REJECTED: "participant:rejected",

  // WebRTC Signaling Relay Pipeline
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  WEBRTC_ICE: "webrtc:ice",

  // Chỉ số phân tích từ AI Engine gửi cho Giáo viên
  EMOTION_UPDATE: "emotion:update",
  ATTENTION_ALERT: "attention:alert",

  // Hệ thống
  ERROR: "error",
} as const;

export type SocketEventKey = keyof typeof SOCKET_EVENTS;
export type SocketEventValue = (typeof SOCKET_EVENTS)[SocketEventKey];
