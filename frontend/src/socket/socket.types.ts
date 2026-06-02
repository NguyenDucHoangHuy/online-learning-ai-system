export const SOCKET_EVENTS = {
  CHAT_SEND: "chat:send",
  CHAT_NEW: "chat:new",
  SESSION_JOIN: "session:join",
  SESSION_LEAVE: "session:leave",
  SESSION_ENDED: "session:ended",
  PARTICIPANT_JOINED: "participant:joined",
  PARTICIPANT_LEFT: "participant:left",
  PARTICIPANT_APPROVED: "participant:approved",
  PARTICIPANT_REJECTED: "participant:rejected",
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  WEBRTC_ICE: "webrtc:ice",
  EMOTION_UPDATE: "emotion:update",
  ATTENTION_ALERT: "attention:alert",
  ERROR: "error",
} as const;

export interface SocketAck<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface SessionJoinPayload {
  sessionId: string;
}

export interface SessionPresencePayload {
  userId: string;
  fullName?: string;
  role: "STUDENT" | "TEACHER";
  joinedAt?: string;
  leftAt?: string;
}

export interface ParticipantStatusPayload {
  participantId: string;
  sessionId: string;
  joinedAt?: string | null;
}

export interface ChatSendPayload {
  sessionId: string;
  message: string;
}

export interface ChatUser {
  id: string;
  fullName: string;
  role: "STUDENT" | "TEACHER";
}

export interface ChatMessagePayload {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  sentAt: string;
  user?: ChatUser;
}

export interface WebRTCSignalPayload {
  sessionId: string;
  targetUserId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit | unknown;
}

export interface WebRTCSignalIncomingPayload {
  sessionId: string;
  fromUserId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit | unknown;
}

export interface EmotionUpdatePayload {
  participantId: string;
  studentId: string;
  studentName: string;
  emotion: string;
  attentionLevel: "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  recordedAt: string;
}
