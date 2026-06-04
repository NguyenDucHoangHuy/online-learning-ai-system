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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import VideoTile from "../../components/ui/VideoTile";
import ParticipantList from "../../components/ui/ParticipantList";
import {
  useSessionDetail,
  useEndSession,
} from "../../services/sessions/sessions.queries";
import {
  aiService,
  type StudentAttentionAnalysis,
} from "../../services/ai/ai.service";
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

interface StudentAiState extends StudentAttentionAnalysis {
  updatedAt: string;
}

interface RemoteScreenShareState {
  userId: string;
  role: string;
  fullName?: string;
  image: string;
  capturedAt?: string;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const screenFrameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenFrameTimerRef = useRef<number | null>(null);
  const screenShareStreamRef = useRef<MediaStream | null>(null);
  const [screenShareStream, setScreenShareStream] =
    useState<MediaStream | null>(null);
  const [isScreenShareExpanded, setIsScreenShareExpanded] = useState(false);
  const [remoteScreenShares, setRemoteScreenShares] = useState<
    Record<string, RemoteScreenShareState>
  >({});
  const [expandedRemoteScreenUserId, setExpandedRemoteScreenUserId] = useState<
    string | null
  >(null);
  const [raisedHands, setRaisedHands] = useState<
    Record<string, { fullName: string; updatedAt: string }>
  >({});
  const isLocalMediaReady = !!localStream;

  const { remoteStreams, initiateCall } = useWebRTCSignaling({
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
  const [remoteMediaStates, setRemoteMediaStates] = useState<
    Record<string, { isMuted: boolean; isVideoOff: boolean }>
  >({});
  const [studentAiStates, setStudentAiStates] = useState<
    Record<string, StudentAiState>
  >({});
  const studentAnalysisBusyRef = useRef<Set<string>>(new Set());

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

  useEffect(() => {
    if (typeof window !== "undefined") return;

    const analyzerTimers: number[] = [];
    const analyzerVideos: HTMLVideoElement[] = [];

    const captureAndAnalyzeStudent = async (
      studentId: string,
      stream: MediaStream,
    ) => {
      if (studentAnalysisBusyRef.current.has(studentId)) return;

      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      analyzerVideos.push(video);

      void video.play().catch((error) => {
        console.warn("Student AI analyzer is waiting for video frames:", error);
      });

      const analyze = async () => {
        if (
          studentAnalysisBusyRef.current.has(studentId) ||
          video.videoWidth === 0 ||
          video.videoHeight === 0
        ) {
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = 224;
        canvas.height = 168;
        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL("image/jpeg", 0.55);

        try {
          studentAnalysisBusyRef.current.add(studentId);
          const result = await aiService.analyzeStudentFrame({
            image,
            studentId,
            sessionId,
          });
          setStudentAiStates((prev) => ({
            ...prev,
            [studentId]: { ...result, updatedAt: new Date().toISOString() },
          }));
        } catch (error) {
          console.warn("Không thể phân tích AI sinh viên:", error);
        } finally {
          studentAnalysisBusyRef.current.delete(studentId);
        }
      };

      void analyze();
      analyzerTimers.push(window.setInterval(analyze, 10000));
    };

    onlineParticipants.forEach((participant) => {
      const studentId = participant.studentId;
      const stream = remoteStreams[studentId];
      const isStudentVideoOff =
        remoteMediaStates[studentId]?.isVideoOff ??
        (stream?.getVideoTracks().length ?? 0) === 0;

      if (!stream || isStudentVideoOff) return;
      void captureAndAnalyzeStudent(studentId, stream);
    });

    return () => {
      analyzerTimers.forEach((timer) => window.clearInterval(timer));
      analyzerVideos.forEach((video) => {
        video.pause();
        video.srcObject = null;
      });
    };
  }, [
    onlineParticipants,
    remoteStreams,
    remoteMediaStates,
    sessionId,
  ]);

  // REST Nạp danh sách chờ duyệt
  useEffect(() => {
    if (!socket || !isConnected || !sessionId) return;

    const handleEmotionUpdate = (payload: {
      sessionId: string;
      studentId: string;
      analysis?: StudentAttentionAnalysis;
      recordedAt?: string;
    }) => {
      if (payload.sessionId !== sessionId || !payload.analysis) return;

      setStudentAiStates((prev) => ({
        ...prev,
        [payload.studentId]: {
          ...payload.analysis!,
          updatedAt: payload.recordedAt || new Date().toISOString(),
        },
      }));
    };

    socket.on(SOCKET_EVENTS.EMOTION_UPDATE, handleEmotionUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.EMOTION_UPDATE, handleEmotionUpdate);
    };
  }, [socket, isConnected, sessionId]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMediaState = (payload: {
      userId: string;
      isMuted: boolean;
      isVideoOff: boolean;
    }) => {
      setRemoteMediaStates((prev) => ({
        ...prev,
        [payload.userId]: {
          isMuted: payload.isMuted,
          isVideoOff: payload.isVideoOff,
        },
      }));
    };

    socket.on(SOCKET_EVENTS.MEDIA_STATE, handleMediaState);

    return () => {
      socket.off(SOCKET_EVENTS.MEDIA_STATE, handleMediaState);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket || !isConnected || !sessionId || !user?.id) return;

    const resolveParticipantName = (userId: string, fallback?: string) => {
      const participant = onlineParticipants.find(
        (item) =>
          item.studentId === userId ||
          item.id === userId ||
          item.student?.id === userId,
      );

      return (
        fallback ||
        participant?.student?.fullName ||
        (participant as ParticipantItem & { fullName?: string })?.fullName ||
        "Hoc vien"
      );
    };

    const handleScreenShareStart = (payload: {
      sessionId: string;
      userId: string;
      role: string;
      fullName?: string;
    }) => {
      if (payload.sessionId !== sessionId || payload.userId === user.id) return;

      setRemoteScreenShares((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          role: payload.role,
          fullName: resolveParticipantName(payload.userId, payload.fullName),
          image: prev[payload.userId]?.image ?? "",
        },
      }));
      setExpandedRemoteScreenUserId(payload.userId);
    };

    const handleScreenShareFrame = (payload: {
      sessionId: string;
      userId: string;
      role: string;
      fullName?: string;
      image: string;
      capturedAt?: string;
    }) => {
      if (payload.sessionId !== sessionId || payload.userId === user.id) return;

      setRemoteScreenShares((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          role: payload.role,
          fullName: resolveParticipantName(payload.userId, payload.fullName),
          image: payload.image,
          capturedAt: payload.capturedAt,
        },
      }));
    };

    const handleScreenShareStop = (payload: {
      sessionId?: string;
      userId: string;
    }) => {
      if (payload.sessionId && payload.sessionId !== sessionId) return;

      setRemoteScreenShares((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      setExpandedRemoteScreenUserId((current) =>
        current === payload.userId ? null : current,
      );
    };

    const handleHandRaise = (payload: {
      sessionId: string;
      userId: string;
      role: string;
      fullName?: string;
      isRaised: boolean;
      updatedAt?: string;
    }) => {
      if (
        payload.sessionId !== sessionId ||
        payload.userId === user.id ||
        payload.role !== "STUDENT"
      ) {
        return;
      }

      setRaisedHands((prev) => {
        const next = { ...prev };
        if (payload.isRaised) {
          next[payload.userId] = {
            fullName: resolveParticipantName(payload.userId, payload.fullName),
            updatedAt: payload.updatedAt || new Date().toISOString(),
          };
        } else {
          delete next[payload.userId];
        }
        return next;
      });
    };

    socket.on(SOCKET_EVENTS.SCREEN_SHARE_START, handleScreenShareStart);
    socket.on(SOCKET_EVENTS.SCREEN_SHARE_FRAME, handleScreenShareFrame);
    socket.on(SOCKET_EVENTS.SCREEN_SHARE_STOP, handleScreenShareStop);
    socket.on(SOCKET_EVENTS.HAND_RAISE, handleHandRaise);

    return () => {
      socket.off(SOCKET_EVENTS.SCREEN_SHARE_START, handleScreenShareStart);
      socket.off(SOCKET_EVENTS.SCREEN_SHARE_FRAME, handleScreenShareFrame);
      socket.off(SOCKET_EVENTS.SCREEN_SHARE_STOP, handleScreenShareStop);
      socket.off(SOCKET_EVENTS.HAND_RAISE, handleHandRaise);
    };
  }, [socket, isConnected, sessionId, user?.id, onlineParticipants]);

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
        socketEmitter.emitSessionLeave(socket, sessionId);
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

  const mediaStateRef = useRef({ isMuted, isVideoOff });
  useEffect(() => {
    mediaStateRef.current = { isMuted, isVideoOff };
  }, [isMuted, isVideoOff]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = isVideoOff ? null : localStream;
    }
  }, [localStream, isVideoOff]);

  useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenShareStream;
    }
    screenShareStreamRef.current = screenShareStream;
  }, [screenShareStream]);

  // Luồng kết nối danh Snapshot và Socket Real-time
  useEffect(() => {
    if (!socket || !isConnected || !sessionId || !user?.id || !isLocalMediaReady)
      return;

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

          activeList.forEach((participant) => {
            initiateCall(participant.studentId, "STUDENT");
          });

          socketEmitter.emitMediaState(socket, {
            sessionId,
            isMuted,
            isVideoOff,
          });
        } catch (err) {
          console.error("🚨 [Radar Teacher ERROR] Đối chiếu thất bại:", err);
        }
      }
    });

    const presenceRoomEvent = `${SOCKET_EVENTS.PARTICIPANT_JOINED}:room`;

    const handleIncomingParticipant = (payload: PresencePayload) => {
      if (payload.userId === user.id) return;
      if (payload.role === "STUDENT") {
        initiateCall(payload.userId, "STUDENT");
      }
      socketEmitter.emitMediaState(socket, {
        sessionId,
        ...mediaStateRef.current,
      });

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
      setRemoteMediaStates((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      setStudentAiStates((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      setRemoteScreenShares((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
      setExpandedRemoteScreenUserId((current) =>
        current === payload.userId ? null : current,
      );
      setRaisedHands((prev) => {
        const next = { ...prev };
        delete next[payload.userId];
        return next;
      });
    };

    socket.on(SOCKET_EVENTS.PARTICIPANT_LEFT, handleLeavingParticipant);

    return () => {
      socket.off(SOCKET_EVENTS.PARTICIPANT_JOINED);
      socket.off(presenceRoomEvent, handleIncomingParticipant);
      socket.off(SOCKET_EVENTS.PARTICIPANT_LEFT, handleLeavingParticipant);
    };
  }, [
    socket,
    isConnected,
    sessionId,
    user?.id,
    isLocalMediaReady,
    initiateCall,
  ]);

  const stopScreenShare = () => {
    if (screenFrameTimerRef.current !== null) {
      window.clearInterval(screenFrameTimerRef.current);
      screenFrameTimerRef.current = null;
    }

    screenShareStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenShareStreamRef.current = null;
    setScreenShareStream(null);
    setIsScreenShareExpanded(false);

    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }

    if (socket && isConnected) {
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_STOP, { sessionId });
    }
  };

  const startScreenShare = async () => {
    if (!socket || !isConnected) {
      alert("Socket chưa sẵn sàng, vui lòng thử lại sau vài giây.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: 8,
        },
        audio: false,
      });
      const [screenTrack] = displayStream.getVideoTracks();

      screenShareStreamRef.current = displayStream;
      setScreenShareStream(displayStream);
      setIsScreenShareExpanded(true);
      socket.emit(SOCKET_EVENTS.SCREEN_SHARE_START, {
        sessionId,
        fullName: user?.fullName,
      });

      screenTrack.addEventListener("ended", stopScreenShare, { once: true });

      window.setTimeout(() => {
        if (!screenVideoRef.current) return;

        const canvas =
          screenFrameCanvasRef.current ?? document.createElement("canvas");
        screenFrameCanvasRef.current = canvas;
        const context = canvas.getContext("2d");
        const publishFrame = () => {
          const video = screenVideoRef.current;
          if (
            !video ||
            !context ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
          ) {
            return;
          }

          const targetWidth = 960;
          const ratio = video.videoHeight / video.videoWidth;
          canvas.width = targetWidth;
          canvas.height = Math.round(targetWidth * ratio);
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          socket.emit(SOCKET_EVENTS.SCREEN_SHARE_FRAME, {
            sessionId,
            fullName: user?.fullName,
            image: canvas.toDataURL("image/jpeg", 0.58),
            capturedAt: new Date().toISOString(),
          });
        };

        publishFrame();
        screenFrameTimerRef.current = window.setInterval(publishFrame, 900);
      }, 600);
    } catch (error) {
      console.warn("Không thể chia sẻ màn hình:", error);
    }
  };

  const toggleScreenShare = () => {
    if (screenShareStream) {
      stopScreenShare();
      return;
    }

    void startScreenShare();
  };

  useEffect(() => {
    return () => {
      if (screenFrameTimerRef.current !== null) {
        window.clearInterval(screenFrameTimerRef.current);
      }
      screenShareStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenShareStreamRef.current = null;
    };
  }, []);

  const toggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const nextMuted = !audioTrack.enabled;
        setIsMuted(nextMuted);
        setLocalStream(new MediaStream(localStream.getTracks()));
        if (socket && isConnected) {
          socketEmitter.emitMediaState(socket, {
            sessionId,
            isMuted: nextMuted,
            isVideoOff,
          });
        }
      }
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      if (!isVideoOff) {
        localStream.getVideoTracks().forEach((track) => track.stop());
        const nextStream = new MediaStream(localStream.getAudioTracks());
        setIsVideoOff(true);
        setLocalStream(nextStream);
        if (videoRef.current) videoRef.current.srcObject = null;
        if (socket && isConnected) {
          socketEmitter.emitMediaState(socket, {
            sessionId,
            isMuted,
            isVideoOff: true,
          });
        }
        return;
      }

      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        const [videoTrack] = cameraStream.getVideoTracks();
        const nextStream = new MediaStream([
          ...localStream.getAudioTracks(),
          videoTrack,
        ]);
        setIsVideoOff(false);
        setLocalStream(nextStream);
        if (videoRef.current) videoRef.current.srcObject = nextStream;
        if (socket && isConnected) {
          socketEmitter.emitMediaState(socket, {
            sessionId,
            isMuted,
            isVideoOff: false,
          });
        }
      } catch (error) {
        console.error("Không thể bật lại camera:", error);
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

  const isStudentCameraOff = (studentId: string) =>
    remoteMediaStates[studentId]?.isVideoOff ??
    remoteHardwareStates[studentId]?.isVideoOff ??
    (remoteStreams[studentId]?.getVideoTracks().length ?? 0) === 0;
  const focusedStudentCount = onlineParticipants.filter((participant) => {
    if (isStudentCameraOff(participant.studentId)) return false;
    return studentAiStates[participant.studentId]?.status === "focused";
  }).length;
  const unfocusedStudentCount = onlineParticipants.filter((participant) => {
    if (isStudentCameraOff(participant.studentId)) return false;
    return studentAiStates[participant.studentId]?.status === "unfocused";
  }).length;
  const absentStudentCount = onlineParticipants.filter((participant) => {
    if (isStudentCameraOff(participant.studentId)) return false;
    return studentAiStates[participant.studentId]?.presence === "absent";
  }).length;
  const cameraOffStudentCount = onlineParticipants.filter((participant) =>
    isStudentCameraOff(participant.studentId),
  ).length;
  const raisedHandList = Object.entries(raisedHands);
  const remoteScreenShareList = Object.values(remoteScreenShares);
  const aiSummaryText =
    onlineParticipants.length === 0
      ? "Chờ sinh viên"
      : `${focusedStudentCount} tập trung • ${unfocusedStudentCount} không tập trung • ${absentStudentCount} vắng mặt • ${cameraOffStudentCount} tắt camera`;

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
            {raisedHandList.length > 0 && (
              <div className="text-left border-r border-white/10 pr-4">
                <p className="text-[9px] text-amber-300 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                  <Hand size={12} />
                  Dang gio tay
                </p>
                <p className="text-amber-200 font-black text-xs uppercase tracking-wider max-w-[220px] truncate">
                  {raisedHandList.map(([, item]) => item.fullName).join(", ")}
                </p>
              </div>
            )}
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
                AI Sinh viên
              </p>
              <p className="text-emerald-400 font-black text-xs uppercase tracking-wider">
                {aiSummaryText}
              </p>
            </div>
          </div>
        </div>

        {/* VIDEO GRID */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          {screenShareStream && (
            <div
              className={`bg-slate-900 rounded-[2rem] border border-blue-500/30 overflow-hidden relative shadow-2xl shadow-blue-950/30 flex items-center justify-center ${
                isScreenShareExpanded
                  ? "h-[520px] sm:col-span-2 lg:col-span-3 xl:col-span-4"
                  : "h-64"
              }`}
            >
              <video
                ref={screenVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain bg-black"
              />
              <div className="absolute left-4 top-4 bg-blue-600/90 backdrop-blur px-3 py-1.5 rounded-xl border border-blue-400/30 text-xs font-black tracking-widest uppercase flex items-center gap-2">
                <Monitor size={14} />
                Màn hình giảng viên
              </div>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScreenShareExpanded((value) => !value)}
                  className="p-2.5 rounded-xl bg-slate-950/80 text-white border border-white/10 hover:bg-slate-800 transition-colors"
                  title={isScreenShareExpanded ? "Thu nhỏ" : "Phóng to"}
                >
                  {isScreenShareExpanded ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={stopScreenShare}
                  className="px-3 py-2.5 rounded-xl bg-rose-600/90 text-white border border-rose-400/30 hover:bg-rose-700 transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                  Dừng
                </button>
              </div>
            </div>
          )}
          {/* Ô WEBCAM GIẢNG VIÊN */}
          {remoteScreenShareList.map((share) => {
            const isExpanded = expandedRemoteScreenUserId === share.userId;

            return (
              <div
                key={share.userId}
                className={`bg-slate-900 rounded-[2rem] border border-amber-500/30 overflow-hidden relative shadow-2xl shadow-amber-950/20 flex items-center justify-center ${
                  isExpanded
                    ? "h-[520px] sm:col-span-2 lg:col-span-3 xl:col-span-4"
                    : "h-64"
                }`}
              >
                {share.image ? (
                  <img
                    src={share.image}
                    alt={`${share.fullName || "Hoc vien"} dang chia se man hinh`}
                    className="h-full w-full object-contain bg-black"
                  />
                ) : (
                  <div className="text-center flex flex-col items-center gap-3">
                    <Monitor size={36} className="text-slate-600" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                      Dang cho man hinh chia se
                    </span>
                  </div>
                )}
                <div className="absolute left-4 top-4 bg-amber-500/90 text-slate-950 backdrop-blur px-3 py-1.5 rounded-xl border border-amber-300/40 text-xs font-black tracking-widest uppercase flex items-center gap-2">
                  <Monitor size={14} />
                  {share.fullName || "Hoc vien"}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedRemoteScreenUserId((current) =>
                      current === share.userId ? null : share.userId,
                    )
                  }
                  className="absolute right-4 top-4 p-2.5 rounded-xl bg-slate-950/80 text-white border border-white/10 hover:bg-slate-800 transition-colors"
                  title={isExpanded ? "Thu nho" : "Phong to"}
                >
                  {isExpanded ? (
                    <Minimize2 size={16} />
                  ) : (
                    <Maximize2 size={16} />
                  )}
                </button>
              </div>
            );
          })}

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
            const aiState = studentAiStates[item.studentId];

            // 🎯 ĐỒNG BỘ CHUẨN LAN: Đọc trạng thái bẫy ra từ State Map Poller vãng lai
            const isStudentMuted =
              remoteMediaStates[item.studentId]?.isMuted ??
              (studentStream
                ? false
                : remoteHardwareStates[item.studentId]?.isMuted ?? true);
            const isStudentVideoOff =
              remoteMediaStates[item.studentId]?.isVideoOff ??
              remoteHardwareStates[item.studentId]?.isVideoOff ??
              true;

            return (
              <VideoTile
                key={item.id}
                name={item.student?.fullName || "Sinh viên"}
                stream={studentStream}
                attentionStatus={
                  aiState?.status === "unfocused" || aiState?.presence === "absent"
                    ? "distracted"
                    : aiState?.status === "focused"
                      ? "focused"
                      : "normal"
                }
                isMuted={isStudentMuted}
                isVideoOff={isStudentVideoOff}
                aiPresence={aiState?.presence}
                aiAttentionLabel={aiState?.attentionLabel}
                aiEmotionLabel={aiState?.emotionLabel}
                aiConfidence={aiState?.confidence}
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

            <button
              onClick={toggleScreenShare}
              className={`p-3.5 rounded-full border transition-colors ${
                screenShareStream
                  ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-700"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 border-white/5"
              }`}
              title={screenShareStream ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
            >
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
    </div>
  );
}
