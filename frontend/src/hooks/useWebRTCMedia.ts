import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { socketEmitter } from "../socket/socket.emitter";
import { WebRTCSignalIncomingPayload } from "../socket/socket.types";

const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type RemoteStreamMap = Record<string, MediaStream>;

export const useWebRTCMedia = ({
  sessionId,
  localUserId,
  peerIds,
  shouldCreateOffers,
}: {
  sessionId: string;
  localUserId?: string;
  peerIds: string[];
  shouldCreateOffers: boolean;
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStreamMap>({});
  const [mediaError, setMediaError] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);

  const peersRef = useRef<Record<string, RTCPeerConnection>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOffersRef = useRef<WebRTCSignalIncomingPayload[]>([]);
  const pendingIceRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
  const retryTimersRef = useRef<Record<string, number>>({});

  const peerKey = useMemo(
    () => peerIds.filter(Boolean).sort().join("|"),
    [peerIds],
  );
  const uniquePeerIds = useMemo(
    () => Array.from(new Set(peerIds.filter((id) => id && id !== localUserId))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [localUserId, peerKey],
  );

  const attachStreamToExistingPeers = useCallback((stream: MediaStream) => {
    Object.values(peersRef.current).forEach((peer) => {
      stream.getTracks().forEach((track) => {
        const sender = peer
          .getSenders()
          .find((item) => item.track?.kind === track.kind);

        if (sender) {
          sender.replaceTrack(track);
          return;
        }

        peer.addTrack(track, stream);
      });
    });
  }, []);

  const startMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaError(
        "Chrome điện thoại đang chặn camera/micro trên HTTP LAN. Hãy mở trang bằng HTTPS để trình duyệt cho phép cấp quyền.",
      );
      return null;
    }

    try {
      setMediaError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = true;
      });

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = stream;
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      setLocalStream(stream);
      attachStreamToExistingPeers(stream);
      return stream;
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMediaError(error.message);
      } else {
        setMediaError("Không thể mở camera hoặc micro.");
      }
    }
  }, [attachStreamToExistingPeers]);

  useEffect(() => {
    let cancelled = false;

    startMedia().then((stream) => {
      if (cancelled && stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      Object.values(retryTimersRef.current).forEach((timer) =>
        window.clearTimeout(timer),
      );
      retryTimersRef.current = {};
      Object.values(peersRef.current).forEach((peer) => peer.close());
      peersRef.current = {};
    };
  }, [startMedia]);

  useEffect(() => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = isAudioEnabled;
    });
  }, [isAudioEnabled, localStream]);

  useEffect(() => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = isVideoEnabled;
    });
  }, [isVideoEnabled, localStream]);

  const getPeer = useCallback(
    (peerId: string) => {
      const existing = peersRef.current[peerId];
      if (existing) return existing;

      if (typeof RTCPeerConnection === "undefined") {
        throw new Error("Trình duyệt không hỗ trợ WebRTC.");
      }

      const peer = new RTCPeerConnection(rtcConfig);
      peersRef.current[peerId] = peer;

      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current as MediaStream);
      });

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;

        setRemoteStreams((current) => ({
          ...current,
          [peerId]: stream,
        }));
      };

      peer.onicecandidate = (event) => {
        if (!event.candidate || !sessionId) return;

        socketEmitter.sendIceCandidate({
          sessionId,
          targetUserId: peerId,
          signal: event.candidate.toJSON(),
        });
      };

      peer.onconnectionstatechange = () => {
        if (
          ["failed", "closed", "disconnected"].includes(peer.connectionState)
        ) {
          if (peersRef.current[peerId] === peer) {
            delete peersRef.current[peerId];
          }
          setRemoteStreams((current) => {
            const next = { ...current };
            delete next[peerId];
            return next;
          });
        }
      };

      return peer;
    },
    [sessionId],
  );

  const createOffer = useCallback(
    async (peerId: string) => {
      if (!sessionId || !localStreamRef.current) return;

      const peer = getPeer(peerId);
      if (peer.signalingState !== "stable") return;

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketEmitter.sendOffer({
        sessionId,
        targetUserId: peerId,
        signal: offer,
      });

      window.clearTimeout(retryTimersRef.current[peerId]);
      retryTimersRef.current[peerId] = window.setTimeout(() => {
        const currentPeer = peersRef.current[peerId];
        if (!currentPeer || currentPeer.remoteDescription) return;

        currentPeer.close();
        delete peersRef.current[peerId];
        setRetryNonce((value) => value + 1);
      }, 5000);
    },
    [getPeer, sessionId],
  );

  useEffect(() => {
    if (!shouldCreateOffers || !sessionId || !localStream) return;

    uniquePeerIds.forEach((peerId) => {
      if (!remoteStreams[peerId]) {
        createOffer(peerId).catch((error) => {
          setMediaError(error?.message || "Cannot start video call");
        });
      }
    });
  }, [
    createOffer,
    localStream,
    remoteStreams,
    retryNonce,
    sessionId,
    shouldCreateOffers,
    uniquePeerIds,
  ]);

  const handleOffer = useCallback(
    async (payload: WebRTCSignalIncomingPayload) => {
      if (payload.sessionId !== sessionId) return;
      if (!localStreamRef.current) {
        pendingOffersRef.current.push(payload);
        return;
      }

      try {
        const peer = getPeer(payload.fromUserId);
        await peer.setRemoteDescription(
          payload.signal as RTCSessionDescriptionInit,
        );

        const queuedCandidates =
          pendingIceRef.current[payload.fromUserId] || [];
        pendingIceRef.current[payload.fromUserId] = [];
        await Promise.all(
          queuedCandidates.map((candidate) => peer.addIceCandidate(candidate)),
        );

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socketEmitter.sendAnswer({
          sessionId,
          targetUserId: payload.fromUserId,
          signal: answer,
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMediaError(error.message);
        } else {
          setMediaError("Cannot answer video call");
        }
      }
    },
    [getPeer, sessionId],
  );

  useEffect(() => {
    if (!localStream || pendingOffersRef.current.length === 0) return;

    const offers = pendingOffersRef.current;
    pendingOffersRef.current = [];
    offers.forEach((offer) => {
      handleOffer(offer);
    });
  }, [handleOffer, localStream]);

  const handleAnswer = useCallback(
    async (payload: WebRTCSignalIncomingPayload) => {
      if (payload.sessionId !== sessionId) return;

      const peer = peersRef.current[payload.fromUserId];
      if (!peer || peer.signalingState === "stable") return;

      try {
        await peer.setRemoteDescription(
          payload.signal as RTCSessionDescriptionInit,
        );
        window.clearTimeout(retryTimersRef.current[payload.fromUserId]);

        const queuedCandidates =
          pendingIceRef.current[payload.fromUserId] || [];
        pendingIceRef.current[payload.fromUserId] = [];
        await Promise.all(
          queuedCandidates.map((candidate) => peer.addIceCandidate(candidate)),
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMediaError(error.message);
        } else {
          setMediaError("Cannot accept video call");
        }
      }
    },
    [sessionId],
  );

  const handleIceCandidate = useCallback(
    async (payload: WebRTCSignalIncomingPayload) => {
      if (payload.sessionId !== sessionId) return;

      try {
        const peer = getPeer(payload.fromUserId);
        const candidate = payload.signal as RTCIceCandidateInit;

        if (!peer.remoteDescription) {
          pendingIceRef.current[payload.fromUserId] = [
            ...(pendingIceRef.current[payload.fromUserId] || []),
            candidate,
          ];
          return;
        }

        await peer.addIceCandidate(candidate);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setMediaError(error.message);
        } else {
          setMediaError("Cannot connect media stream");
        }
      }
    },
    [getPeer, sessionId],
  );

  return {
    localStream,
    remoteStreams,
    mediaError,
    startMedia,
    isAudioEnabled,
    isVideoEnabled,
    setIsAudioEnabled,
    setIsVideoEnabled,
    handlers: {
      onWebRTCOffer: handleOffer,
      onWebRTCAnswer: handleAnswer,
      onWebRTCIce: handleIceCandidate,
    },
  };
};
