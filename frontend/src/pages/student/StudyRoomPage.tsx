// src/pages/student/StudyRoomPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MessageSquare,
  BrainCircuit,
  Send,
  Users,
  MonitorUp,
  Loader2,
  ShieldAlert,
  MoreVertical,
} from "lucide-react";

import ParticipantList from "../../components/ui/ParticipantList";
import { useAuthStore } from "../../stores/auth.store";
import { useSocket } from "../../socket/socket.client";
import { socketEmitter } from "../../socket/socket.emitter";
import { useWebRTCSignaling } from "../../features/webrtc/hooks/useWebRTCSignaling";
import { SOCKET_EVENTS } from "../../constants/events.constants";
import { useSessionDetail } from "../../services/sessions/sessions.queries";
import { ParticipantItem } from "../../types/api/participant.types";
import { ROUTES } from "../../constants";
import { api } from "../../lib/axios";
import { useRoomChat } from "../../features/chat/hooks/useRoomChat";

interface PresencePayload {
  userId: string;
  fullName: string;
  role: string;
  joinedAt: string;
}

interface UIParticipantItem extends ParticipantItem {
  role?: "TEACHER" | "STUDENT";
}

interface ExpectedSessionData {
  id: string;
  title: string;
  sessionCode: string;
  status: string;
  endedAt?: string;
  class: {
    id: string;
    name: string;
    teacherId: string;
  };
}

function useAudioActivity(stream: MediaStream | undefined, threshold = 12) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setIsSpeaking(false);
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let total = 0;
      for (let i = 0; i < bufferLength; i++) {
        total += dataArray[i];
      }
      const average = total / bufferLength;
      setIsSpeaking(average > threshold);
      animationFrameId = requestAnimationFrame(checkVolume);
    };

    checkVolume();

    return () => {
      cancelAnimationFrame(animationFrameId);
      source.disconnect();
      analyser.disconnect();
      if (audioContext.state !== "closed") {
        audioContext.close().catch((err) => console.warn(err));
      }
    };
  }, [stream, threshold]);

  return isSpeaking;
}

function RemoteStudentTile({
  item,
  stream,
  isMuted = false,
  isVideoOff = false,
}: {
  item: ParticipantItem;
  stream: MediaStream | undefined;
  isMuted?: boolean;
  isVideoOff?: boolean;
}) {
  const isSpeaking = useAudioActivity(stream);
  const fullName = item.student?.fullName || "Sinh viên";
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div
      className={`bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden h-64 relative shadow-md transition-all duration-300 flex flex-col items-center justify-center ${
        isSpeaking && !isMuted
          ? "ring-4 ring-emerald-500 shadow-xl shadow-emerald-500/20 scale-[1.01]"
          : "hover:border-white/10"
      }`}
    >
      <audio ref={audioRef} autoPlay className="hidden" />

      {isVideoOff ? (
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-black bg-slate-800 text-slate-300 border border-white/5">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Camera đã tắt
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
              isSpeaking && !isMuted
                ? "bg-emerald-500 text-slate-950 animate-pulse shadow-lg shadow-emerald-500/30"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>
          {isSpeaking && !isMuted && (
            <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-widest animate-bounce">
              Speaking
            </span>
          )}
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold flex items-center gap-2 max-w-[80%]">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isSpeaking && !isMuted ? "bg-emerald-500 animate-ping" : "bg-slate-500"}`}
          />
          <span className="truncate text-slate-200">{fullName}</span>
        </div>
      </div>

      {isMuted && (
        <div className="absolute bottom-4 right-4 bg-rose-600/90 text-white border border-rose-500/30 p-2 rounded-xl backdrop-blur-md z-10 pointer-events-none flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
          <MicOff size={14} />
        </div>
      )}
    </div>
  );
}

export default function StudyRoomPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [isLeaving, setIsLeaving] = useState(false);

  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const { socket, isConnected } = useSocket();
  const user = useAuthStore((s) => s.user);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [countdownText, setCountdownText] = useState(
    "Thời gian còn lại: --:--:--",
  );
  const [onlineParticipants, setOnlineParticipants] = useState<
    UIParticipantItem[]
  >([]);

  const { data: sessionResponse, isLoading: isDetailsLoading } =
    useSessionDetail(sessionId);
  const sessionData = sessionResponse
    ? (sessionResponse as unknown as ExpectedSessionData)
    : null;

  const { remoteStreams, initiateCall } = useWebRTCSignaling({
    socket,
    isConnected,
    sessionId,
    currentUserId: user?.id || "",
    currentUserRole: "STUDENT",
    localStream,
  });

  // 🎯 REAL-TIME CHAT ENGINE
  const {
    messages,
    inputValue,
    setInputValue,
    chatBottomRef,
    handleSendMessage,
  } = useRoomChat({ socket, isConnected, sessionId });

  // 🎯 BỘ ĐỒNG BỘ THỜI GIAN THỰC PHẦN CỨNG ĐẦU XA PHÍA HỌC SINH
  const [remoteHardwareStates, setRemoteHardwareStates] = useState<
    Record<string, { isMuted: boolean; isVideoOff: boolean }>
  >({});

  useEffect(() => {
    const checkTracks = () => {
      setRemoteHardwareStates((prev) => {
        const newState = { ...prev };
        let hasChanged = false;

        Object.entries(remoteStreams).forEach(([userId, stream]) => {
          if (!stream) return;
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];

          const isTrackVideoOff = videoTrack
            ? !videoTrack.enabled ||
              videoTrack.muted ||
              videoTrack.readyState === "ended"
            : true;
          const isTrackAudioMuted = audioTrack
            ? !audioTrack.enabled ||
              audioTrack.muted ||
              audioTrack.readyState === "ended"
            : true;

          if (
            !newState[userId] ||
            newState[userId].isVideoOff !== isTrackVideoOff ||
            newState[userId].isMuted !== isTrackAudioMuted
          ) {
            newState[userId] = {
              isMuted: isTrackAudioMuted,
              isVideoOff: isTrackVideoOff,
            };
            hasChanged = true;
          }
        });

        return hasChanged ? newState : prev;
      });
    };

    checkTracks();
    const interval = setInterval(checkTracks, 1000); // Quét kiểm tra liên mạng LAN mỗi 1 giây
    return () => clearInterval(interval);
  }, [remoteStreams]);

  // Vòng đời Cam/Mic
  useEffect(() => {
    let hardwareStream: MediaStream | null = null;
    async function startHardware() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        hardwareStream = stream;
        setLocalStream(stream);
      } catch (err) {
        console.error("🚨 Không thể truy cập thiết bị phần cứng Cam/Mic:", err);
      }
    }
    startHardware();

    return () => {
      if (hardwareStream) {
        hardwareStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Đếm ngược thời gian thực tự hủy
  useEffect(() => {
    if (!sessionData?.endedAt) return;
    const endTime = new Date(sessionData.endedAt).getTime();

    const handleAutoLeaveRoom = async () => {
      alert(
        "Buổi học đã hết thời gian giới hạn. Hệ thống tự động đóng phòng học.",
      );
      if (localStream) localStream.getTracks().forEach((track) => track.stop());
      try {
        await api.patch(`/sessions/${sessionId}/leave`);
      } catch (e) {
        console.error("🚨 Lỗi khi rời khỏi phòng học:", e);
      }
      if (socket && isConnected)
        socket.emit("leave:room", { sessionId, userId: user?.id });
      navigate(ROUTES.STUDENT_JOIN, { replace: true });
    };

    const updateTimer = () => {
      const currentTime = new Date().getTime();
      const remainingTimeMs = endTime - currentTime;

      if (remainingTimeMs <= 0) {
        setCountdownText("00:00:00 — BUỔI HỌC KẾT THÚC");
        clearInterval(timerInterval);
        handleAutoLeaveRoom();
        return;
      }

      const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);
      const formatStr = [hours, minutes, seconds]
        .map((v) => String(v).padStart(2, "0"))
        .join(":");
      setCountdownText(`Thời gian còn lại: ${formatStr}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [
    sessionData?.endedAt,
    localStream,
    socket,
    isConnected,
    sessionId,
    user?.id,
    navigate,
  ]);

  const localStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Luồng đón tín hiệu giải tán phòng
  useEffect(() => {
    if (!socket || !sessionId) return;

    console.log(
      "🔒 [Session Ended Guard] Đã cắm chốt lắng nghe lệnh đóng phòng vĩnh cửu...",
    );

    const onSessionClosed = (payload: {
      sessionId: string;
      endedBy?: "TEACHER" | "SYSTEM";
    }) => {
      if (payload.sessionId === sessionId) {
        console.log(
          "🚨 [Room Closed] Nhận Canonical Signal! Phòng đã bị đóng.",
        );
        if (payload.endedBy === "SYSTEM") {
          alert(
            "Buổi học đã hết thời gian giới hạn. Hệ thống tự động đóng phòng học.",
          );
        } else {
          alert(
            "Buổi học trực tuyến này đã được Giảng viên kết thúc. Hệ thống tự động đóng cửa phòng học!",
          );
        }

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        socket.emit("leave:room", { sessionId, userId: user?.id });
        navigate(ROUTES.STUDENT_JOIN, { replace: true });
      }
    };

    socket.on("session:ended", onSessionClosed);

    return () => {
      socket.off("session:ended", onSessionClosed);
    };
  }, [socket, sessionId, navigate, user?.id]);

  // Socket bắt tay danh sách hiện diện
  useEffect(() => {
    if (
      !socket ||
      !isConnected ||
      !sessionId ||
      !localStream ||
      !user?.id ||
      !sessionData
    )
      return;

    socketEmitter.emitSessionJoin(socket, sessionId, (ack) => {
      if (ack.success && ack.onlineUsers) {
        const activeList = ack.onlineUsers
          .filter((u) => u.userId !== user.id)
          .map((u) => {
            const isThisUserTeacher =
              u.userId === sessionData.class?.teacherId ||
              u.role?.toUpperCase() === "TEACHER";
            return {
              id: u.userId,
              sessionId,
              studentId: u.userId,
              role: isThisUserTeacher ? "TEACHER" : "STUDENT",
              joinStatus: "APPROVED" as const,
              attemptNumber: 1,
              joinedAt: u.joinedAt,
              leftAt: null,
              student: { id: u.userId, fullName: u.fullName, email: "" },
            } as UIParticipantItem;
          });
        setOnlineParticipants(activeList);

        ack.onlineUsers.forEach((u) => {
          if (u.userId !== user.id) {
            initiateCall(
              u.userId,
              u.role === "TEACHER" ? "TEACHER" : "STUDENT",
            );
          }
        });
      }
    });

    const presenceRoomEvent = `${SOCKET_EVENTS.PARTICIPANT_JOINED}:room`;
    socket.on(presenceRoomEvent, (payload: PresencePayload) => {
      console.log(
        "📥 [Radar Student] Nhận tín hiệu thời gian thực có người khác vừa vào phòng:",
        payload,
      );
    });

    return () => {
      socket.off(presenceRoomEvent);
    };
  }, [
    socket,
    isConnected,
    sessionId,
    localStream,
    user?.id,
    sessionData,
    initiateCall,
  ]);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        setLocalStream(new MediaStream(localStream.getTracks()));
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        setLocalStream(new MediaStream(localStream.getTracks()));
      }
    }
  };

  const handleLeaveRoom = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn thoát khỏi phòng học trực tuyến này không?",
      )
    )
      return;
    try {
      setIsLeaving(true);
      await api.patch(`/sessions/${sessionId}/leave`);
    } catch (err) {
      console.warn(err);
    }
    {
      if (localStream) localStream.getTracks().forEach((track) => track.stop());
      if (socket && isConnected)
        socket.emit("leave:room", { sessionId, userId: user?.id });
      setIsLeaving(false);
      navigate(ROUTES.STUDENT_JOIN, { replace: true });
    }
  };

  const handleToggleSidebar = (tab: "chat" | "participants") => {
    if (showRightSidebar && activeTab === tab) {
      setShowRightSidebar(false);
    } else {
      setActiveTab(tab);
      setShowRightSidebar(true);
    }
  };

  if (isDetailsLoading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-sm font-semibold tracking-wider">
          ĐANG ĐỒNG BỘ PHÒNG HỌC WEBSOCKETS...
        </p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400 p-4">
        <ShieldAlert className="text-rose-500" size={48} />
        <p className="text-base font-bold">
          Không tìm thấy lớp học hoặc phiên làm việc đã kết thúc.
        </p>
        <button
          onClick={() => navigate(ROUTES.STUDENT_JOIN)}
          className="px-5 py-2 bg-slate-900 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-slate-800"
        >
          QUAY VỀ TRANG NHẬP MÃ
        </button>
      </div>
    );
  }

  if (sessionData.status === "WAITING") {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400 p-4 text-center">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mb-2 animate-pulse">
          ⏱️
        </div>
        <h3 className="text-lg font-black text-slate-200 uppercase tracking-tight">
          Buổi học chưa bắt đầu!
        </h3>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-medium">
          Phòng học trực tuyến{" "}
          <span className="text-blue-400">"{sessionData.title}"</span> hiện vẫn
          đang đóng cửa. Vui lòng đợi Giảng viên kích hoạt mở lớp giảng dạy!
        </p>
        <button
          onClick={() => navigate(ROUTES.STUDENT_JOIN)}
          className="mt-2 px-6 py-2.5 bg-slate-900 border border-white/5 text-xs font-bold text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md"
        >
          QUAY LẠI TRANG SẢNH CHỜ
        </button>
      </div>
    );
  }

  const teacherParticipant = onlineParticipants.find(
    (p) => p.studentId === sessionData.class.teacherId,
  );
  const otherStudents = onlineParticipants.filter(
    (p) => p.studentId !== sessionData.class.teacherId,
  );
  const teacherStream = remoteStreams[sessionData.class.teacherId];

  // 🎯 ĐỒNG BỘ: Chuyển sang đọc trạng thái bẫy từ bộ Map Poller nội bộ Wi-Fi LAN
  const isTeacherMuted =
    remoteHardwareStates[sessionData.class.teacherId]?.isMuted ?? true;
  const isTeacherVideoOff =
    remoteHardwareStates[sessionData.class.teacherId]?.isVideoOff ?? true;

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      <div className="flex-1 flex flex-col p-4 relative overflow-hidden h-full transition-all duration-300 ease-in-out">
        {/* TOP HEADER BAR */}
        <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-center bg-black/40 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-800/50 shadow-lg">
          <h2 className="font-semibold text-sm uppercase text-slate-200">
            MÔN HỌC: {sessionData.class.name} — {sessionData.title}
          </h2>
          <div className="text-xs text-amber-400 font-mono tracking-widest uppercase font-black bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
            ⏱️ {countdownText}
          </div>
        </div>

        <div className="flex-1 w-full h-full flex flex-col gap-4 mt-20 overflow-hidden">
          {isScreenSharing ? (
            <>
              <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center relative overflow-hidden shadow-2xl">
                <div className="text-center">
                  <MonitorUp
                    size={48}
                    className="text-slate-600 mx-auto mb-4"
                  />
                  <p className="text-slate-400 font-medium">
                    Giảng viên đang chia sẻ màn hình...
                  </p>
                </div>
              </div>

              <div className="h-40 flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x">
                <div className="w-64 flex-shrink-0 snap-start bg-slate-900 rounded-2xl overflow-hidden relative border border-white/5 flex items-center justify-center">
                  {teacherStream && !isTeacherVideoOff ? (
                    <video
                      ref={(el) => {
                        if (el) el.srcObject = teacherStream;
                      }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-black uppercase">
                        {(teacherParticipant?.student?.fullName || "GV").charAt(
                          0,
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Camera đóng
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-slate-950/70 px-2 py-1 rounded-lg text-[10px] font-bold">
                    Giảng viên{" "}
                    {isTeacherMuted && (
                      <span className="text-rose-400 font-mono">(Muted)</span>
                    )}
                  </div>
                </div>

                <div className="w-64 flex-shrink-0 snap-start bg-slate-900 rounded-2xl overflow-hidden relative border border-white/5 flex items-center justify-center">
                  {localStream && !isVideoOff ? (
                    <video
                      ref={(el) => {
                        if (el) el.srcObject = localStream;
                      }}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="text-center flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-sm font-black uppercase">
                        {(user?.fullName || "ST").charAt(0)}
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Camera đóng
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-slate-950/70 px-2 py-1 rounded-lg text-[10px] font-bold text-blue-400">
                    Bạn{" "}
                    {isMuted && (
                      <span className="text-rose-400 font-mono">(Muted)</span>
                    )}
                  </div>
                </div>

                {otherStudents.map((p) => {
                  const companionStream = remoteStreams[p.studentId];
                  return (
                    <div key={p.id} className="w-64 flex-shrink-0 snap-start">
                      <RemoteStudentTile
                        item={p}
                        stream={companionStream}
                        isMuted={
                          remoteHardwareStates[p.studentId]?.isMuted ?? true
                        }
                        isVideoOff={
                          remoteHardwareStates[p.studentId]?.isVideoOff ?? true
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
              {/* Ô 1: WEBCAM GIẢNG VIÊN */}
              <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden h-64 relative shadow-md flex items-center justify-center">
                {teacherStream && !isTeacherVideoOff ? (
                  <video
                    ref={(el) => {
                      if (el) el.srcObject = teacherStream;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center gap-3 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xl font-black uppercase shadow-inner border border-white/5">
                      {(teacherParticipant?.student?.fullName || "GV").charAt(
                        0,
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Giảng viên đã tắt camera
                    </span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isTeacherVideoOff ? "bg-slate-500" : "bg-blue-500 animate-pulse"}`}
                  />
                  {teacherParticipant?.student?.fullName ||
                    "Giảng viên chủ phòng"}
                  {isTeacherMuted && (
                    <span className="text-rose-400 text-[10px] font-mono">
                      (Muted)
                    </span>
                  )}
                </div>

                {isTeacherMuted && (
                  <div className="absolute bottom-4 right-4 bg-rose-600/90 text-white border border-rose-500/30 p-2 rounded-xl backdrop-blur-md z-10 pointer-events-none flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
                    <MicOff size={14} />
                  </div>
                )}
              </div>

              {/* Ô 2: CHÍNH BẠN */}
              <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden h-64 relative shadow-md flex items-center justify-center">
                {localStream && !isVideoOff ? (
                  <video
                    ref={(el) => {
                      if (el) el.srcObject = localStream;
                    }}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xl font-black uppercase">
                      {(user?.fullName || "ST").charAt(0)}
                    </div>
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Webcam của bạn đang tắt
                    </span>
                  </div>
                )}

                <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-blue-400 flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isVideoOff ? "bg-slate-500" : "bg-emerald-500"}`}
                  />
                  Bạn ({user?.fullName}){" "}
                  {isMuted && (
                    <span className="text-rose-400 text-[10px] font-mono">
                      (Muted)
                    </span>
                  )}
                </div>

                {isMuted && (
                  <div className="absolute bottom-4 right-4 bg-rose-600/90 text-white border border-rose-500/30 p-2 rounded-xl backdrop-blur-md z-10 pointer-events-none flex items-center justify-center shadow-lg">
                    <MicOff size={14} />
                  </div>
                )}
              </div>

              {/* Ô 3: CÁC BẠN HỌC SINH KHÁC */}
              {otherStudents.map((p) => {
                const companionStream = remoteStreams[p.studentId];
                return (
                  <RemoteStudentTile
                    key={p.id}
                    item={p}
                    stream={companionStream}
                    isMuted={remoteHardwareStates[p.studentId]?.isMuted ?? true}
                    isVideoOff={
                      remoteHardwareStates[p.studentId]?.isVideoOff ?? true
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* CONTROLS BUTTONS BAR */}
        <div className="h-20 mt-4 flex items-center justify-between bg-slate-950/40 px-4 border-t border-white/5 rounded-2xl flex-shrink-0">
          <div className="text-[10px] text-slate-500 font-mono tracking-widest w-1/4 uppercase font-bold hidden sm:block">
            {new Date().toLocaleDateString("vi-VN")} | EduSense
          </div>

          <div className="flex items-center gap-3 justify-center flex-1 sm:w-1/2">
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-full transition-colors ${isMuted ? "bg-rose-500/20 text-rose-500" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5"}`}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-colors ${isVideoOff ? "bg-rose-500/20 text-rose-500" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5"}`}
            >
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>
            <button className="p-4 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
              <Hand size={22} />
            </button>

            <button
              onClick={() => setIsScreenSharing(!isScreenSharing)}
              className={`p-3.5 rounded-xl transition-colors ${isScreenSharing ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-white/5"}`}
            >
              <MonitorUp size={18} />
            </button>

            <button
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className="px-6 py-3.5 bg-rose-600 text-white rounded-full font-black text-xs tracking-widest hover:bg-rose-700 transition-colors shadow-lg ml-2 uppercase disabled:opacity-50"
            >
              {isLeaving ? "LEAVING..." : "RỜI PHÒNG"}
            </button>
          </div>

          <div className="flex items-center gap-2 w-1/4 justify-end">
            <button
              onClick={() => handleToggleSidebar("participants")}
              className={`p-3 rounded-xl border border-white/5 transition-colors relative ${showRightSidebar && activeTab === "participants" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              <Users size={16} />
            </button>

            <button
              onClick={() => handleToggleSidebar("chat")}
              className={`p-3 rounded-xl border border-white/5 transition-colors relative ${showRightSidebar && activeTab === "chat" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              <MessageSquare size={16} />
            </button>

            <button className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors hidden sm:block">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SIDEBAR RIGHT CONTAINER */}
      {showRightSidebar && (
        <div className="w-80 h-full border-l border-white/5 bg-slate-900 z-10 flex-shrink-0 flex flex-col animate-in slide-in-from-right-8 duration-300">
          <div className="p-4 border-b border-white/5">
            <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-2xl p-4 flex items-start gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 flex-shrink-0">
                <BrainCircuit size={20} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                  AI Phân tích
                </p>
                <p className="text-sm font-black text-emerald-400 uppercase">
                  Trạng thái: Tập trung tốt
                </p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-medium">
                  Hệ thống đang ghi nhận bạn rất chú ý bài giảng.
                </p>
              </div>
            </div>
          </div>

          <div className="flex border-b border-white/5 bg-slate-950/20 flex-shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-colors ${activeTab === "chat" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/20" : "text-slate-500 hover:text-slate-300"}`}
            >
              <MessageSquare size={15} /> Trò chuyện
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 py-3.5 text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-colors ${activeTab === "participants" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/20" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Users size={15} /> Mọi người
            </button>
          </div>

          {activeTab === "chat" ? (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">
                    Giảng viên
                  </span>
                  <p className="text-sm bg-slate-800 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl w-fit text-slate-200 font-medium">
                    Chào các bạn, chúng ta bắt đầu bài học nhé!
                  </p>
                </div>

                {messages.map((msg) => {
                  const msgIsMe = msg.userId === user?.id;
                  const msgIsTeacher = msg.user.role === "TEACHER";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 max-w-[85%] ${msgIsMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide ${msgIsMe ? "text-blue-400" : msgIsTeacher ? "text-amber-400" : "text-slate-400"}`}
                      >
                        {msg.user.fullName} {msgIsTeacher && "• (Giảng viên)"}
                      </span>
                      <p
                        className={`text-xs p-3 rounded-2xl leading-relaxed font-medium border ${
                          msgIsMe
                            ? "bg-blue-600 text-white border-blue-500 rounded-tr-none shadow-md shadow-blue-900/10"
                            : "bg-slate-800/80 text-slate-200 border-white/5 rounded-tl-none"
                        }`}
                      >
                        {msg.message}
                      </p>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-4 bg-slate-950/20 border-t border-white/5 flex-shrink-0"
              >
                <div className="bg-slate-950 rounded-xl border border-white/5 flex items-center p-1.5 focus-within:border-blue-500/40 transition-colors">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-transparent border-none text-xs px-2.5 focus:outline-none text-slate-200 font-medium placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <ParticipantList
                onlineParticipants={onlineParticipants}
                pendingParticipants={[]}
                onQueueActionSuccess={() => {}}
                onClose={() => setShowRightSidebar(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
