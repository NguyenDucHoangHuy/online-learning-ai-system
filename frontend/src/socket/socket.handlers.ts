import { socket } from "./socket.client";
import {
  ChatMessagePayload,
  EmotionUpdatePayload,
  ParticipantStatusPayload,
  SessionPresencePayload,
  SOCKET_EVENTS,
  WebRTCSignalIncomingPayload,
} from "./socket.types";

export interface SocketHandlerMap {
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
  onError?: (payload: unknown) => void;
  onParticipantJoined?: (payload: SessionPresencePayload) => void;
  onParticipantLeft?: (payload: SessionPresencePayload) => void;
  onParticipantApproved?: (payload: ParticipantStatusPayload) => void;
  onParticipantRejected?: (payload: ParticipantStatusPayload) => void;
  onChatNew?: (payload: ChatMessagePayload) => void;
  onEmotionUpdate?: (payload: EmotionUpdatePayload) => void;
  onWebRTCOffer?: (payload: WebRTCSignalIncomingPayload) => void;
  onWebRTCAnswer?: (payload: WebRTCSignalIncomingPayload) => void;
  onWebRTCIce?: (payload: WebRTCSignalIncomingPayload) => void;
}

export const registerSocketHandlers = (handlers: SocketHandlerMap) => {
  const subscriptions: Array<[string, (...args: unknown[]) => void]> = [];

  const on = <TPayload>(
    event: string,
    handler?: (payload: TPayload) => void,
  ) => {
    if (!handler) return;

    const listener = ((payload: TPayload) => handler(payload)) as (
      ...args: unknown[]
    ) => void;
    socket.on(event, listener);
    subscriptions.push([event, listener]);
  };

  const onNoPayload = (event: string, handler?: () => void) => {
    if (!handler) return;

    const listener = (() => handler()) as (...args: unknown[]) => void;
    socket.on(event, listener);
    subscriptions.push([event, listener]);
  };

  const onDisconnect = handlers.onDisconnect
    ? ((reason: string) => handlers.onDisconnect?.(reason)) as (
        ...args: unknown[]
      ) => void
    : undefined;
  const onConnectError = handlers.onConnectError
    ? ((error: Error) => handlers.onConnectError?.(error)) as (
        ...args: unknown[]
      ) => void
    : undefined;

  onNoPayload("connect", handlers.onConnect);
  if (onDisconnect) {
    socket.on("disconnect", onDisconnect);
    subscriptions.push(["disconnect", onDisconnect]);
  }
  if (onConnectError) {
    socket.on("connect_error", onConnectError);
    subscriptions.push(["connect_error", onConnectError]);
  }

  on(SOCKET_EVENTS.ERROR, handlers.onError);
  on<SessionPresencePayload>(
    SOCKET_EVENTS.PARTICIPANT_JOINED,
    handlers.onParticipantJoined,
  );
  on<SessionPresencePayload>(
    SOCKET_EVENTS.PARTICIPANT_LEFT,
    handlers.onParticipantLeft,
  );
  on<ParticipantStatusPayload>(
    SOCKET_EVENTS.PARTICIPANT_APPROVED,
    handlers.onParticipantApproved,
  );
  on<ParticipantStatusPayload>(
    SOCKET_EVENTS.PARTICIPANT_REJECTED,
    handlers.onParticipantRejected,
  );
  on<ChatMessagePayload>(SOCKET_EVENTS.CHAT_NEW, handlers.onChatNew);
  on<EmotionUpdatePayload>(
    SOCKET_EVENTS.EMOTION_UPDATE,
    handlers.onEmotionUpdate,
  );
  on<WebRTCSignalIncomingPayload>(
    SOCKET_EVENTS.WEBRTC_OFFER,
    handlers.onWebRTCOffer,
  );
  on<WebRTCSignalIncomingPayload>(
    SOCKET_EVENTS.WEBRTC_ANSWER,
    handlers.onWebRTCAnswer,
  );
  on<WebRTCSignalIncomingPayload>(SOCKET_EVENTS.WEBRTC_ICE, handlers.onWebRTCIce);

  return () => {
    subscriptions.forEach(([event, listener]) => {
      socket.off(event, listener);
    });
  };
};
