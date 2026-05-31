export const SOCKET_EVENTS = {
  // Session
  SESSION_JOIN: "session:join",
  SESSION_LEAVE: "session:leave",

  PARTICIPANT_JOINED: "participant:joined",
  PARTICIPANT_LEFT: "participant:left",

  // Chat
  CHAT_SEND: "chat:send",
  CHAT_NEW: "chat:new",

  // WebRTC
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  WEBRTC_ICE: "webrtc:ice",

  // Emotion
  EMOTION_UPDATE: "emotion:update",
} as const;
