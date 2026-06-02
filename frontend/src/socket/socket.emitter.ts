import { socket } from "./socket.client";
import {
  ChatMessagePayload,
  ChatSendPayload,
  SessionJoinPayload,
  SocketAck,
  SOCKET_EVENTS,
  WebRTCSignalPayload,
} from "./socket.types";

const emitWithAck = <TResponse = unknown, TPayload = unknown>(
  event: string,
  payload: TPayload,
  timeoutMs = 8000,
) => {
  return new Promise<SocketAck<TResponse>>((resolve) => {
    socket.timeout(timeoutMs).emit(event, payload, (error: Error, ack: SocketAck<TResponse>) => {
      if (error) {
        resolve({
          success: false,
          message: error.message || "Socket request timed out",
        });
        return;
      }

      resolve(ack);
    });
  });
};

export const socketEmitter = {
  joinSession: (sessionId: string) =>
    emitWithAck<void, SessionJoinPayload>(SOCKET_EVENTS.SESSION_JOIN, {
      sessionId,
    }),

  leaveSession: (sessionId: string) =>
    emitWithAck<void, SessionJoinPayload>(SOCKET_EVENTS.SESSION_LEAVE, {
      sessionId,
    }),

  sendChatMessage: (payload: ChatSendPayload) =>
    emitWithAck<ChatMessagePayload, ChatSendPayload>(
      SOCKET_EVENTS.CHAT_SEND,
      payload,
    ),

  sendOffer: (payload: WebRTCSignalPayload) => {
    socket.emit(SOCKET_EVENTS.WEBRTC_OFFER, payload);
  },

  sendAnswer: (payload: WebRTCSignalPayload) => {
    socket.emit(SOCKET_EVENTS.WEBRTC_ANSWER, payload);
  },

  sendIceCandidate: (payload: WebRTCSignalPayload) => {
    socket.emit(SOCKET_EVENTS.WEBRTC_ICE, payload);
  },
};
