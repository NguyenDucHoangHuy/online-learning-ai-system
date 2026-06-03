export const SOCKET_EVENTS = {
  // Chat
  CHAT_SEND: "chat:send",
  CHAT_NEW: "chat:new",

  // Session
  SESSION_JOIN: "session:join",
  SESSION_LEAVE: "session:leave",
  SESSION_ENDED: "session:ended",
  MEDIA_STATE: "media:state",

  // Participant — Server → Student private room
  PARTICIPANT_JOINED: "participant:joined",
  PARTICIPANT_LEFT: "participant:left",
  PARTICIPANT_APPROVED: "participant:approved",
  PARTICIPANT_REJECTED: "participant:rejected",

  // WebRTC Signaling — Client ↔ Client qua Server relay
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  WEBRTC_ICE: "webrtc:ice",

  // Emotion — Server → Teacher private room
  EMOTION_UPDATE: "emotion:update",
  ATTENTION_ALERT: "attention:alert",

  // System
  ERROR: "error",
} as const;

export type SocketEventKey = keyof typeof SOCKET_EVENTS;
export type SocketEventValue = (typeof SOCKET_EVENTS)[SocketEventKey];
