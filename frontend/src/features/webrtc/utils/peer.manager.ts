// src/features/webrtc/utils/peer.manager.ts
import { Socket } from "socket.io-client";
import { socketEmitter } from "../../../socket/socket.emitter";

export class PeerManager {
  private peerConnections = new Map<string, RTCPeerConnection>();
  private peerTargetRoles = new Map<string, "TEACHER" | "STUDENT">();
  private peerSenders = new Map<
    string,
    { audio?: RTCRtpSender; video?: RTCRtpSender }
  >();

  // 🎯 FIX VẤN ĐỀ 3: Kho lưu trữ hàng đợi ứng viên mạng đập tan lỗi ICE đè trước Offer
  private iceQueues = new Map<string, RTCIceCandidateInit[]>();

  private socket: Socket;
  private sessionId: string;
  private currentUserId: string;

  // 🎯 FIX VẤN ĐỀ 1: Cho phép khởi tạo rỗng, nạp động qua tiến trình bất đồng bộ sau đó
  private localStream: MediaStream | null = null;
  private onTrackCallback: (targetUserId: string, stream: MediaStream) => void;

  constructor(
    socket: Socket,
    sessionId: string,
    currentUserId: string,
    _currentUserRole: "TEACHER" | "STUDENT",
    onTrackCallback: (targetUserId: string, stream: MediaStream) => void,
  ) {
    this.socket = socket;
    this.sessionId = sessionId;
    this.currentUserId = currentUserId;
    this.onTrackCallback = onTrackCallback;
  }

  /**
   * 🎯 FIX VẤN ĐỀ 1: Hàm nạp luồng camera/mic phần cứng sau khi getUserMedia hoàn tất
   */
  public updateLocalStream(stream: MediaStream) {
    this.localStream = stream;
    console.log(
      "🍏 [PeerManager] Đã nạp thành công thiết bị phần cứng Local Stream động.",
    );

    this.refreshAllConnections();
  }

  public getOrCreateConnection(
    targetUserId: string,
    targetUserRole: "TEACHER" | "STUDENT",
  ): RTCPeerConnection {
    const existingPc = this.peerConnections.get(targetUserId);
    if (existingPc) {
      this.peerTargetRoles.set(targetUserId, targetUserRole);
      this.syncLocalTracks(targetUserId, targetUserRole, existingPc);
      return existingPc;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    this.peerTargetRoles.set(targetUserId, targetUserRole);
    this.syncLocalTracks(targetUserId, targetUserRole, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketEmitter.emitWebRTCIce(this.socket, {
          sessionId: this.sessionId,
          targetUserId,
          signal: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.onTrackCallback(targetUserId, remoteStream);
    };

    this.peerConnections.set(targetUserId, pc);
    return pc;
  }

  private syncLocalTracks(
    targetUserId: string,
    _targetUserRole: "TEACHER" | "STUDENT",
    pc: RTCPeerConnection,
  ) {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0] ?? null;
    const videoTrack = this.localStream.getVideoTracks()[0] ?? null;

    const senders = pc.getSenders();
    const senderState = this.peerSenders.get(targetUserId) ?? {};
    const audioSender =
      senderState.audio ??
      senders.find((sender) => sender.track?.kind === "audio");
    const videoSender =
      senderState.video ??
      senders.find((sender) => sender.track?.kind === "video");

    if (audioSender) {
      void audioSender.replaceTrack(audioTrack);
    } else if (audioTrack) {
      senderState.audio = pc.addTrack(audioTrack, this.localStream);
    }

    if (videoSender) {
      void videoSender.replaceTrack(videoTrack);
    } else if (videoTrack) {
      senderState.video = pc.addTrack(videoTrack, this.localStream);
    }

    if (audioSender) senderState.audio = audioSender;
    if (videoSender) senderState.video = videoSender;
    this.peerSenders.set(targetUserId, senderState);
  }

  private refreshAllConnections() {
    this.peerConnections.forEach((pc, targetUserId) => {
      const targetUserRole = this.peerTargetRoles.get(targetUserId);
      if (!targetUserRole) return;

      this.syncLocalTracks(targetUserId, targetUserRole, pc);
    });
  }

  /**
   * Bên chủ động gọi phát tin OFFER (Người vào sau phát lệnh gõ cửa)
   */
  public async createAndSendOffer(
    targetUserId: string,
    targetUserRole: "TEACHER" | "STUDENT",
  ) {
    // 🎯 ĐẬP TAN BUG COLLISION: Kiểm tra Tie-Breaker ngay đầu hàm để tránh false-log và tối ưu RAM/CPU
    if (this.currentUserId > targetUserId) {
      console.log(
        `⏳ [WebRTC Tie-Breaker] Nhường quyền phát Offer cho đối tác có ID nhỏ hơn: ${targetUserId}`,
      );
      return;
    }

    // Chỉ khi vượt qua "ải" so sánh ID, hệ thống mới chính thức nổ máy kích hoạt kết nối
    console.log(
      `📡 [PeerManager] Tiến hành phát cuộc gọi gõ cửa tới: ${targetUserId}`,
    );
    const pc = this.getOrCreateConnection(targetUserId, targetUserRole);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketEmitter.emitWebRTCOffer(this.socket, {
        sessionId: this.sessionId,
        targetUserId,
        signal: offer,
      });
    } catch (err) {
      console.error("🚨 Lỗi tạo WebRTC Offer:", err);
    }
  }

  public async handleIncomingOffer(
    fromUserId: string,
    targetUserRole: "TEACHER" | "STUDENT",
    offer: RTCSessionDescriptionInit,
  ) {
    const pc = this.getOrCreateConnection(fromUserId, targetUserRole);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketEmitter.emitWebRTCAnswer(this.socket, {
        sessionId: this.sessionId,
        targetUserId: fromUserId,
        signal: answer,
      });

      // 🎯 FIX VẤN ĐỀ 3: Remote Description đã set xong -> Kích nổ xả hàng đợi ứng viên ICE
      await this.flushIceQueue(fromUserId, pc);
    } catch (err) {
      console.error("🚨 Lỗi xử lý Offer nhận được:", err);
    }
  }

  public async handleIncomingAnswer(
    fromUserId: string,
    answer: RTCSessionDescriptionInit,
  ) {
    const pc = this.peerConnections.get(fromUserId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        // 🎯 FIX VẤN ĐỀ 3: Trả lời Answer đồng bộ xong -> Kích nổ xả hàng đợi ứng viên ICE
        await this.flushIceQueue(fromUserId, pc);
      } catch (err) {
        console.error("🚨 Lỗi nạp Remote Description từ Answer:", err);
      }
    }
  }

  /**
   * 🎯 FIX VẤN ĐỀ 3: Bẫy ứng viên ICE Candidate thông minh chống Race Condition
   */
  public async handleIncomingIce(
    fromUserId: string,
    candidate: RTCIceCandidateInit,
  ) {
    const pc = this.peerConnections.get(fromUserId);

    // Kịch bản lý tưởng: Nếu đường ống PC đã thiết lập xong cấu trúc Remote -> Nạp thẳng ăn tiền
    if (pc && pc.remoteDescription) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("🚨 Lỗi nạp thẳng ICE Candidate:", err);
      }
    } else {
      // Kịch bản hiểm họa: ICE đến trước Offer -> Găm nhanh vào hàng đợi chờ lệnh giải phóng
      console.log(
        `⏳ [ICE Queue] Đống ứng viên của User ${fromUserId} đến sớm. Đang tạm găm vào hàng chờ...`,
      );
      if (!this.iceQueues.has(fromUserId)) {
        this.iceQueues.set(fromUserId, []);
      }
      this.iceQueues.get(fromUserId)!.push(candidate);
    }
  }

  /**
   * Giải phóng đống hàng đợi ứ đọng
   */
  private async flushIceQueue(userId: string, pc: RTCPeerConnection) {
    const queue = this.iceQueues.get(userId);
    if (!queue || queue.length === 0) return;

    console.log(
      `🚀 [ICE Queue] Đang tiến hành xả kho ${queue.length} ứng viên mạng cho User: ${userId}`,
    );
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("🚨 Lỗi xả kho ứng viên ICE:", err);
      }
    }
    this.iceQueues.delete(userId); // Xóa sạch kho
  }

  /**
   * 🎯 FIX VẤN ĐỀ 4: Cắt tỉa biệt lập một kết nối khi có thành viên offline rời phòng học
   */
  public removeConnection(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      console.log(
        `🧹 [PeerManager] Tiến hành thu hồi đường ống PeerConnection của User: ${userId}`,
      );
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.iceQueues.delete(userId);
    this.peerTargetRoles.delete(userId);
    this.peerSenders.delete(userId);
  }

  public clearAllConnections() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    this.iceQueues.clear();
    this.peerTargetRoles.clear();
    this.peerSenders.clear();
  }
}
