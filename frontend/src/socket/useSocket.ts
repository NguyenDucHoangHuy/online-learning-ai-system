import { useEffect } from "react";
import { connectSocket, refreshSocketAuth, socket } from "./socket.client";
import {
  registerSocketHandlers,
  SocketHandlerMap,
} from "./socket.handlers";
import { socketEmitter } from "./socket.emitter";

export const useSocket = (handlers: SocketHandlerMap = {}) => {
  useEffect(() => {
    refreshSocketAuth();
    connectSocket();

    return registerSocketHandlers(handlers);
  }, [
    handlers.onConnect,
    handlers.onDisconnect,
    handlers.onConnectError,
    handlers.onError,
    handlers.onParticipantJoined,
    handlers.onParticipantLeft,
    handlers.onParticipantApproved,
    handlers.onParticipantRejected,
    handlers.onChatNew,
    handlers.onEmotionUpdate,
    handlers.onWebRTCOffer,
    handlers.onWebRTCAnswer,
    handlers.onWebRTCIce,
  ]);

  return {
    socket,
    emitter: socketEmitter,
    isConnected: socket.connected,
  };
};

export const useSessionSocket = (
  sessionId: string,
  handlers: SocketHandlerMap = {},
) => {
  const socketApi = useSocket(handlers);

  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    socketApi.emitter.joinSession(sessionId).then((ack) => {
      if (isMounted && !ack.success) {
        console.warn("Socket session join failed:", ack.message);
      }
    });

    return () => {
      isMounted = false;
      socketApi.emitter.leaveSession(sessionId);
    };
  }, [sessionId, socketApi.emitter]);

  return socketApi;
};
