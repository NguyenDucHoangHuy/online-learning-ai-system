// src/features/webrtc/utils/peer.manager.ts
import { Socket } from "socket.io-client";
import { socketEmitter } from "../../../socket/socket.emitter";

type PeerRole = "TEACHER" | "STUDENT";
type SenderState = { audio?: RTCRtpSender; video?: RTCRtpSender };

export class PeerManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private peerTargetRoles = new Map<string, PeerRole>();
  private peerSenders = new Map<string, SenderState>();
  private iceQueues = new Map<string, RTCIceCandidateInit[]>();
  private makingOffers = new Map<string, boolean>();
  private negotiationQueues = new Map<string, Promise<void>>();

  private localStream: MediaStream | null = null;

  constructor(
    private socket: Socket,
    private sessionId: string,
    private currentUserId: string,
    _currentUserRole: PeerRole,
    private onTrackCallback: (targetUserId: string, stream: MediaStream) => void,
  ) {}

  public updateLocalStream(stream: MediaStream) {
    this.localStream = stream;
    this.refreshAllConnections();
  }

  public getOrCreateConnection(
    targetUserId: string,
    targetUserRole: PeerRole,
  ): RTCPeerConnection {
    const existingPc = this.peerConnections.get(targetUserId);
    if (existingPc) {
      this.peerTargetRoles.set(targetUserId, targetUserRole);
      this.syncLocalTracks(targetUserId, existingPc);
      return existingPc;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      socketEmitter.emitWebRTCIce(this.socket, {
        sessionId: this.sessionId,
        targetUserId,
        signal: event.candidate,
      });
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.onTrackCallback(targetUserId, remoteStream);
      }
    };

    this.peerConnections.set(targetUserId, pc);
    this.peerTargetRoles.set(targetUserId, targetUserRole);
    this.syncLocalTracks(targetUserId, pc);
    return pc;
  }

  private syncLocalTracks(targetUserId: string, pc: RTCPeerConnection) {
    if (!this.localStream) return;

    const alreadyNegotiated = !!pc.localDescription || !!pc.remoteDescription;
    const senderState = this.peerSenders.get(targetUserId) ?? {};
    const senders = pc.getSenders();
    let addedNewTrack = false;

    const audioTrack = this.localStream.getAudioTracks()[0] ?? null;
    const videoTrack = this.localStream.getVideoTracks()[0] ?? null;
    const audioSender =
      senderState.audio ??
      senders.find((sender) => sender.track?.kind === "audio");
    const videoSender =
      senderState.video ??
      senders.find((sender) => sender.track?.kind === "video");

    if (audioSender) {
      void audioSender.replaceTrack(audioTrack);
      senderState.audio = audioSender;
    } else if (audioTrack) {
      senderState.audio = pc.addTrack(audioTrack, this.localStream);
      addedNewTrack = true;
    }

    if (videoSender) {
      void videoSender.replaceTrack(videoTrack);
      senderState.video = videoSender;
    } else if (videoTrack) {
      senderState.video = pc.addTrack(videoTrack, this.localStream);
      addedNewTrack = true;
    }

    this.peerSenders.set(targetUserId, senderState);

    if (addedNewTrack && alreadyNegotiated) {
      this.queueRenegotiation(targetUserId);
    }
  }

  private refreshAllConnections() {
    this.peerConnections.forEach((pc, targetUserId) => {
      this.syncLocalTracks(targetUserId, pc);
    });
  }

  public async createAndSendOffer(
    targetUserId: string,
    targetUserRole: PeerRole,
  ) {
    if (this.currentUserId > targetUserId) {
      return;
    }

    this.getOrCreateConnection(targetUserId, targetUserRole);
    await this.sendOffer(targetUserId);
  }

  private queueRenegotiation(targetUserId: string) {
    const currentQueue =
      this.negotiationQueues.get(targetUserId) ?? Promise.resolve();
    const nextQueue = currentQueue
      .catch(() => undefined)
      .then(() => this.sendOffer(targetUserId));

    this.negotiationQueues.set(targetUserId, nextQueue);
  }

  private async sendOffer(targetUserId: string) {
    const pc = this.peerConnections.get(targetUserId);
    if (!pc || pc.connectionState === "closed") return;

    if (pc.signalingState !== "stable") {
      return;
    }

    this.makingOffers.set(targetUserId, true);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketEmitter.emitWebRTCOffer(this.socket, {
        sessionId: this.sessionId,
        targetUserId,
        signal: offer,
      });
    } catch (err) {
      console.error("WebRTC offer failed:", err);
    } finally {
      this.makingOffers.set(targetUserId, false);
    }
  }

  public async handleIncomingOffer(
    fromUserId: string,
    targetUserRole: PeerRole,
    offer: RTCSessionDescriptionInit,
  ) {
    const pc = this.getOrCreateConnection(fromUserId, targetUserRole);

    try {
      const offerCollision =
        this.makingOffers.get(fromUserId) || pc.signalingState !== "stable";
      const politePeer = this.currentUserId > fromUserId;

      if (offerCollision && !politePeer) {
        return;
      }

      if (offerCollision) {
        await pc.setLocalDescription({ type: "rollback" });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketEmitter.emitWebRTCAnswer(this.socket, {
        sessionId: this.sessionId,
        targetUserId: fromUserId,
        signal: answer,
      });

      await this.flushIceQueue(fromUserId, pc);
    } catch (err) {
      console.error("WebRTC offer handling failed:", err);
    }
  }

  public async handleIncomingAnswer(
    fromUserId: string,
    answer: RTCSessionDescriptionInit,
  ) {
    const pc = this.peerConnections.get(fromUserId);
    if (!pc || pc.signalingState !== "have-local-offer") return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.flushIceQueue(fromUserId, pc);
    } catch (err) {
      console.error("WebRTC answer handling failed:", err);
    }
  }

  public async handleIncomingIce(
    fromUserId: string,
    candidate: RTCIceCandidateInit,
  ) {
    const pc = this.peerConnections.get(fromUserId);

    if (pc?.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("WebRTC ICE candidate failed:", err);
      }
      return;
    }

    if (!this.iceQueues.has(fromUserId)) {
      this.iceQueues.set(fromUserId, []);
    }
    this.iceQueues.get(fromUserId)!.push(candidate);
  }

  private async flushIceQueue(userId: string, pc: RTCPeerConnection) {
    const queue = this.iceQueues.get(userId);
    if (!queue?.length) return;

    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Queued WebRTC ICE candidate failed:", err);
      }
    }

    this.iceQueues.delete(userId);
  }

  public removeConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }

    this.iceQueues.delete(userId);
    this.peerTargetRoles.delete(userId);
    this.peerSenders.delete(userId);
    this.makingOffers.delete(userId);
    this.negotiationQueues.delete(userId);
  }

  public clearAllConnections() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.iceQueues.clear();
    this.peerTargetRoles.clear();
    this.peerSenders.clear();
    this.makingOffers.clear();
    this.negotiationQueues.clear();
  }
}
