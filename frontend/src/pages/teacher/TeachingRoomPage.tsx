// src/pages/teacher/TeachingRoomPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mic,
  Video,
  Monitor,
  Hand,
  BarChart2,
  MessageSquare,
  MoreVertical,
  Users,
  Send,
  Loader2,
  ShieldAlert,
  LogOut,
  VideoOff,
  MicOff,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import VideoTile from "../../components/ui/VideoTile";
import ParticipantList from "../../components/ui/ParticipantList";
import {
  useSessionDetail,
  useEndSession,
} from "../../services/sessions/sessions.queries";
import { aiService } from "../../services/ai/ai.service";
import { ROUTES } from "../../constants";
import { useSocket } from "../../socket/socket.client";
import { SOCKET_EVENTS } from "../../constants/events.constants";
import { socketEmitter } from "../../socket/socket.emitter";
import { api } from "../../lib/axios";
import { ParticipantItem } from "../../types/api/participant.types";
import { useAuthStore } from "../../stores/auth.store";
import { useWebRTCSignaling } from "../../features/webrtc/hooks/useWebRTCSignaling";
import { useRoomChat } from "../../features/chat/hooks/useRoomChat";

interface PresencePayload {
  userId: string;
  fullName: string;
  role: string;
  joinedAt: string;
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

interface LeaveToastState {
  id: string;
  message: string;
}

export default function TeachingRoomPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { socket, isConnected } = useSocket();
  const user = useAuthStore((s) => s.user);

  const {
    messages,
    inputValue,
    setInputValue,
    chatBottomRef,
    handleSendMessage,
  } = useRoomChat({ socket, isConnected, sessionId });

  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [leaveToasts, setLeaveToasts] = useState<LeaveToastState[]>([]);

  const [countdownText, setCountdownText] = useState(
    "Thời gian còn lại: --:--:--",
  );

  const { data: sessionResponse, isLoading: isDetailsLoading } =
    useSessionDetail(sessionId);
  const { mutate: endSession, isPending: isEnding } = useEndSession();

  const sessionData = sessionResponse
    ? (sessionResponse as unknown as ExpectedSessionData)
    : null;

  const [onlineParticipants, setOnlineParticipants] = useState<
    ParticipantItem[]
  >([]);
  const [pendingStudents, setPendingStudents] = useState<ParticipantItem[]>([]);

  const [emotionStatus, setEmotionStatus] = useState<
    "focused" | "normal" | "distracted"
  >("normal");
  const [emotionName, setEmotionName] = useState("neutral");
  const isAnalyzingRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const { remoteStreams } = useWebRTCSignaling({
    socket,
    isConnected,
    sessionId,
    currentUserId: user?.id || "",
    currentUserRole: "TEACHER",
    localStream,
  });

  // 🎯 BỔ SUNG: BỘ ĐỒNG BỘ THỜI GIAN THỰC PHẦN CỨNG ĐẦU XA PHÍA GIÁO VIÊN
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
    const interval = setInterval(checkTracks, 1000); // Đập poller quét track mạng LAN 1 giây/lần cực nhẹ
    return () => clearInterval(interval);
  }, [remoteStreams]);

  // REST Nạp danh sách chờ duyệt
  const { data: rawPendingData } = useQuery<ParticipantItem[]>({
    queryKey: ["session-participants-pending", sessionId],
    queryFn: async () => {
      const res = await api.get<unknown>(
        `/sessions/${sessionId}/participants?status=PENDING`,
      );
      let extractedArray: ParticipantItem[] = [];
      if (Array.isArray(res.data)) {
        extractedArray = res.data as ParticipantItem[];
      } else if (res.data && typeof res.data === "object") {
        const castedRes = res.data as Record<string, unknown>;
        if ("data" in castedRes && Array.isArray(castedRes.data)) {
          extractedArray = castedRes.data as ParticipantItem[];
        }
      }
      return extractedArray;
    },
    enabled: !!sessionId,
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (Array.isArray(rawPendingData)) {
      setPendingStudents(rawPendingData);
    }
  }, [rawPendingData]);

  // Vòng đời khởi động phần cứng Camera
  useEffect(() => {
    let hardwareStream: MediaStream | null = null;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        hardwareStream = stream;
        setLocalStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("🚨 Lỗi truy cập Camera Giảng viên:", error);
      }
    }
    if (!isDetailsLoading && sessionData) startCamera();

    return () => {
      if (hardwareStream) {
        hardwareStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isDetailsLoading, sessionData]);

  // Đếm ngược thời gian thực tự hủy
  useEffect(() => {
    if (!sessionData?.endedAt) return;
    const endTime = new Date(sessionData.endedAt).getTime();

    const handleAutoEndSession = async () => {
      alert(
        "Buổi học đã hết thời gian giới hạn của hệ thống. Phòng dạy tự động đóng cửa!",
      );
      if (localStream) localStream.getTracks().forEach((track) => track.stop());

      try {
        await api.patch(`/sessions/${sessionId}/end`, { endedBy: "SYSTEM" });
      } catch (apiErr) {
        console.warn(apiErr);
      }

      if (socket && isConnected) {
        socket.emit("leave:room", { sessionId, userId: user?.id });
      }
      navigate(ROUTES.TEACHER_DASHBOARD, { replace: true });
    };

    const updateTimer = () => {
      const currentTime = new Date().getTime();
      const remainingTimeMs = endTime - currentTime;

      if (remainingTimeMs <= 0) {
        setCountdownText("00:00:00 — HẾT GIỜ BUỔI HỌC");
        clearInterval(timerInterval);
        handleAutoEndSession();
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

  // Luồng kết nối danh Snapshot và Socket Real-time
  useEffect(() => {
    if (!socket || !isConnected || !sessionId || !user?.id) return;

    console.log(
      "👨‍🏫 [Presence Engine] Kích hoạt kết nối và gắp Snapshot phòng học...",
    );

    socketEmitter.emitSessionJoin(socket, sessionId, async (ack) => {
      if (ack.success && ack.onlineUsers) {
        try {
          const dbParticipantsRes = await api.get<unknown>(
            `/sessions/${sessionId}/participants?status=APPROVED`,
          );

          const resData =
            (dbParticipantsRes.data as {
              data?: unknown;
              participants?: unknown;
            }) || {};
          const dbApprovedList = (
            Array.isArray(dbParticipantsRes.data)
              ? dbParticipantsRes.data
              : resData.data || resData.participants || []
          ) as unknown[];

          const validApprovedUserIds = new Set<string>(
            dbApprovedList
              .map((p: unknown) =>
                typeof p === "object" && p !== null
                  ? (
                      p as {
                        studentId?: string;
                        id?: string;
                        student?: { id?: string };
                      }
                    ).studentId ||
                    (p as { id?: string }).id ||
                    (p as { student?: { id?: string } }).student?.id
                  : undefined,
              )
              .filter((id): id is string => !!id),
          );

          const activeList = ack.onlineUsers
            .filter((u) => {
              const isNotMe = u.userId !== user.id;
              const isReallyApprovedInDB = validApprovedUserIds.has(u.userId);
              return isNotMe && isReallyApprovedInDB;
            })
            .map((u) => ({
              id: u.userId,
              sessionId,
              studentId: u.userId,
              joinStatus: "APPROVED" as const,
              attemptNumber: 1,
              joinedAt: u.joinedAt,
              leftAt: null,
              fullName: u.fullName,
              student: { id: u.userId, fullName: u.fullName, email: "" },
            }));

          setOnlineParticipants(activeList as ParticipantItem[]);
        } catch (err) {
          console.error("🚨 [Radar Teacher ERROR] Đối chiếu thất bại:", err);
        }
      }
    });

    const presenceRoomEvent = `${SOCKET_EVENTS.PARTICIPANT_JOINED}:room`;

    const handleIncomingParticipant = (payload: PresencePayload) => {
      if (payload.userId === user.id) return;

      setOnlineParticipants((prev) => {
        if (
          prev.some(
            (s) => s.studentId === payload.userId || s.id === payload.userId,
          )
        )
          return prev;

        const newOnlineStudent: ParticipantItem & { fullName?: string } = {
          id: payload.userId,
          sessionId,
          studentId: payload.userId,
          joinStatus: "APPROVED",
          attemptNumber: 1,
          joinedAt: payload.joinedAt || new Date().toISOString(),
          leftAt: null,
          fullName: payload.fullName,
          student: {
            id: payload.userId,
            fullName: payload.fullName,
            email: "",
          },
        };
        return [...prev, newOnlineStudent];
      });
    };

    socket.on(presenceRoomEvent, handleIncomingParticipant);

    const handleLeavingParticipant = (payload: {
      userId: string;
      role: string;
    }) => {
      let leftStudentName = "Một học viên";
      let isStudentInClassGrid = false;

      setOnlineParticipants((prev) => {
        const target = prev.find(
          (s) =>
            s.studentId === payload.userId ||
            s.id === payload.userId ||
            s.student?.id === payload.userId,
        );

        if (target) {
          isStudentInClassGrid = true;
          leftStudentName =
            (target as ParticipantItem & { fullName?: string }).fullName ||
            target.student?.fullName ||
            "Học viên";
        }

        if (isStudentInClassGrid) {
          const toastId = Math.random().toString(36).substring(2, 9);
          const newToast: LeaveToastState = {
            id: toastId,
            message: `${leftStudentName} đã rời khỏi lớp học.`,
          };
          setLeaveToasts((currentToasts) => [...currentToasts, newToast]);
          setTimeout(() => {
            setLeaveToasts((currentToasts) =>
              currentToasts.filter((t) => t.id !== toastId),
            );
          }, 4000);
        }

        return prev.filter(
          (s) =>
            s.studentId !== payload.userId &&
            s.id !== payload.userId &&
            s.student?.id !== payload.userId,
        );
      });

      setPendingStudents((prevPending) =>
        prevPending.filter(
          (p) =>
            p.studentId !== payload.userId && p.student?.id !== payload.userId,
        ),
      );
    };

    socket.on(SOCKET_EVENTS.PARTICIPANT_LEFT, handleLeavingParticipant);

    return () => {
      socket.off(SOCKET_EVENTS.PARTICIPANT_JOINED);
      socket.off(presenceRoomEvent, handleIncomingParticipant);
      socket.off(SOCKET_EVENTS.PARTICIPANT_LEFT, handleLeavingParticipant);
    };
  }, [socket, isConnected, sessionId, user?.id]);

  const captureFrameAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (
      !video ||
      !canvas ||
      video.paused ||
      video.ended ||
      isAnalyzingRef.current
    )
      return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg", 0.6);
    try {
      isAnalyzingRef.current = true;
      const data = await aiService.detectEmotion(imageData);
      if (data) {
        setEmotionStatus(data.status || "focused");
        setEmotionName(data.emotion || "neutral");
      }
    } catch (error) {
      console.warn(error);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      captureFrameAndAnalyze();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const handleEndSession = () => {
    if (!sessionId) return;
    if (
      window.confirm(
        "Bạn có chắc chắn muốn kết thúc buổi học này và đóng phòng dạy không?",
      )
    ) {
      endSession(
        { sessionId, payload: { endedBy: "TEACHER" } },
        {
          onSuccess: () => {
            navigate(ROUTES.TEACHER_DASHBOARD);
          },
        },
      );
    }
  };

  const handleQueueActionSuccess = (participantId: string) => {
    setPendingStudents((prev) => prev.filter((p) => p.id !== participantId));
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
          ĐANG XÁC THỰC QUYỀN PHÒNG DẠY...
        </p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400 p-4">
        <ShieldAlert className="text-rose-500" size={48} />
        <p className="text-base font-bold">
          Không tìm thấy phòng học hoặc phiên làm việc đã hết hạn.
        </p>
        <button
          onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
          className="px-5 py-2 bg-slate-900 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-slate-800"
        >
          QUAY VỀ DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      <div className="flex-1 flex flex-col h-full transition-all duration-300 ease-in-out">
        {/* TOP BAR */}
        <div className="p-4 flex justify-between items-start z-10">
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-3 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5 font-mono">
                Recording Live — CODE: {sessionData.sessionCode}
              </p>
              <h2 className="font-extrabold text-sm text-slate-200 uppercase tracking-tight">
                {sessionData.title}
              </h2>
            </div>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 text-right shadow-2xl flex items-center gap-4">
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
                AI Teacher State
              </p>
              <p className="text-emerald-400 font-black text-xs uppercase tracking-wider">
                {emotionName} ({emotionStatus})
              </p>
            </div>
          </div>
        </div>

        {/* VIDEO GRID */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {/* Ô WEBCAM GIẢNG VIÊN */}
          <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden h-64 relative shadow-md flex items-center justify-center">
            {localStream && !isVideoOff ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-lg font-black uppercase">
                  {(user?.fullName || "GV").charAt(0)}
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Camera của bạn đang tắt
                </span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold tracking-wide flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isVideoOff ? "bg-slate-500" : "bg-blue-500"}`}
              />
              {user?.fullName || "Giảng viên"}{" "}
              {isMuted && (
                <span className="text-rose-400 text-[10px] font-mono">
                  (Muted)
                </span>
              )}
            </div>
          </div>

          {/* Ô DANH SÁCH HỌC VIÊN ĐỘNG */}
          {onlineParticipants.map((item) => {
            const studentStream = remoteStreams[item.studentId];

            // 🎯 ĐỒNG BỘ CHUẨN LAN: Đọc trạng thái bẫy ra từ State Map Poller vãng lai
            const isStudentMuted =
              remoteHardwareStates[item.studentId]?.isMuted ?? true;
            const isStudentVideoOff =
              remoteHardwareStates[item.studentId]?.isVideoOff ?? true;

            return (
              <VideoTile
                key={item.id}
                name={item.student?.fullName || "Sinh viên"}
                // Nếu học sinh gạt tắt cam hoàn toàn -> Truyền undefined để dập khung đen, tự đổ Avatar Placeholder tức thì!
                stream={isStudentVideoOff ? undefined : studentStream}
                attentionStatus="focused"
                isMuted={isStudentMuted}
              />
            );
          })}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="p-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
          <div className="text-[10px] text-amber-400 font-mono tracking-widest uppercase font-black bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-xl w-fit">
            ⏱️ {countdownText}
          </div>

          <div className="flex items-center gap-3 w-1/3 justify-center">
            <button
              onClick={toggleMic}
              className={`p-3.5 rounded-full transition-colors border ${
                isMuted
                  ? "bg-rose-500/20 text-rose-500 border-rose-500/30 hover:bg-rose-500/30"
                  : "bg-slate-900 text-slate-300 border-white/5 hover:bg-slate-800"
              }`}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-full transition-colors border ${
                isVideoOff
                  ? "bg-rose-500/20 text-rose-500 border-rose-500/30 hover:bg-rose-500/30"
                  : "bg-slate-900 text-slate-300 border-white/5 hover:bg-slate-800"
              }`}
            >
              {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>

            <button className="p-3.5 bg-slate-900 text-slate-300 rounded-full hover:bg-slate-800 border border-white/5 transition-colors">
              <Monitor size={18} />
            </button>
            <button className="p-3.5 bg-slate-900 text-slate-300 rounded-full hover:bg-slate-800 border border-white/5 transition-colors">
              <Hand size={18} />
            </button>
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-8 py-3.5 bg-rose-600 text-white rounded-full font-black text-xs tracking-widest hover:bg-rose-700 transition-colors shadow-lg ml-2 disabled:opacity-50 uppercase"
            >
              {isEnding ? "CLOSING..." : "KẾT THÚC"}
            </button>
          </div>

          <div className="flex items-center gap-3 w-1/3 justify-end">
            <button className="p-3 rounded-xl border border-white/5 transition-colors relative bg-slate-900 text-slate-300 hover:bg-slate-800">
              <BarChart2 size={16} />
            </button>

            <button
              onClick={() => handleToggleSidebar("participants")}
              className={`p-3 rounded-xl border border-white/5 transition-colors relative ${showRightSidebar && activeTab === "participants" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              <Users size={16} />
              {pendingStudents.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-slate-950 animate-bounce">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            <button
              onClick={() => handleToggleSidebar("chat")}
              className={`p-3 rounded-xl border border-white/5 transition-colors relative ${showRightSidebar && activeTab === "chat" ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              <MessageSquare size={16} />
            </button>

            <button className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SIDEBAR RIGHT CONTAINER */}
      {showRightSidebar && (
        <div className="w-80 h-full border-l border-white/5 bg-slate-900 z-10 flex-shrink-0 flex flex-col animate-in slide-in-from-right-8 duration-300">
          <div className="flex border-b border-white/5 bg-slate-950/20 flex-shrink-0">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "chat" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/10" : "text-slate-500 hover:text-slate-300"}`}
            >
              <MessageSquare size={14} /> Trò chuyện
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === "participants" ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/10" : "text-slate-500 hover:text-slate-300"}`}
            >
              <Users size={14} /> Học viên
            </button>
          </div>

          {activeTab === "chat" ? (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wide">
                    Hệ thống AI
                  </span>
                  <p className="text-xs bg-slate-800/60 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl text-slate-300 leading-relaxed font-medium border border-white/5">
                    Chào mừng Thầy/Cô trở lại lớp học trực tuyến EduSense. Kênh
                    trò chuyện real-time đã sẵn sàng tác chiến!
                  </p>
                </div>

                {messages.map((msg) => {
                  const isMe = msg.userId === user?.id;
                  const isTeacher = msg.user.role === "TEACHER";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                    >
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide ${isMe ? "text-blue-400" : isTeacher ? "text-amber-400" : "text-slate-400"}`}
                      >
                        {msg.user.fullName} {isTeacher && "• (Giảng viên)"}
                      </span>
                      <p
                        className={`text-xs p-3 rounded-2xl leading-relaxed font-medium border ${
                          isMe
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
                className="p-4 bg-slate-950/40 border-t border-white/5 flex-shrink-0"
              >
                <div className="bg-slate-950 rounded-xl border border-white/5 flex items-center p-1.5 focus-within:border-blue-500/40 transition-colors">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Nhập tin nhắn nội bộ lớp..."
                    className="flex-1 bg-transparent border-none text-xs px-2.5 focus:outline-none text-slate-200 font-medium placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all active:scale-95 shadow-lg shadow-blue-600/10"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <ParticipantList
                onlineParticipants={onlineParticipants}
                pendingParticipants={pendingStudents}
                onQueueActionSuccess={handleQueueActionSuccess}
                onClose={() => setShowRightSidebar(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* TOAST BOX CONTAINER */}
      <div className="absolute bottom-24 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {leaveToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-rose-500/20 text-rose-200 text-xs px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-12 fade-in duration-300 relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 h-[2px] bg-rose-500 animate-out fade-out duration-4000 origin-left scale-x-0 w-full" />
            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 flex-shrink-0">
              <LogOut size={14} />
            </div>
            <p className="font-semibold tracking-wide leading-relaxed">
              {toast.message}
            </p>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
