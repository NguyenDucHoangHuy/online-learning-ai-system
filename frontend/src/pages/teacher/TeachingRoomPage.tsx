// src/pages/teacher/TeachingRoomPage.tsx
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart2,
  Check,
  Hand,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  MoreVertical,
  Send,
  ShieldAlert,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import ParticipantList from "../../components/ui/ParticipantList";
import VideoTile from "../../components/ui/VideoTile";
import { ROUTES } from "../../constants";
import { useWebRTCMedia } from "../../hooks/useWebRTCMedia";
import { aiService } from "../../services/ai/ai.service";
import {
  useApproveParticipant,
  useRejectParticipant,
  useSessionParticipants,
} from "../../services/participants/participants.queries";
import {
  useEndSession,
  useSessionDetail,
  useStartSession,
} from "../../services/sessions/sessions.queries";
import { useAuthStore } from "../../stores/auth.store";
import { useSessionSocket } from "../../socket/useSocket";
import {
  ChatMessagePayload,
  SessionPresencePayload,
} from "../../socket/socket.types";

type RoomParticipant = {
  id: string;
  name: string;
  role: "teacher" | "student";
  status: "focused" | "normal" | "distracted";
  isMuted: boolean;
};

export default function TeachingRoomPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [showParticipants, setShowParticipants] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [liveParticipants, setLiveParticipants] = useState<RoomParticipant[]>(
    [],
  );
  const [socketMessage, setSocketMessage] = useState("Connecting realtime...");
  const [emotionStatus, setEmotionStatus] = useState<
    "focused" | "normal" | "distracted"
  >("normal");
  const [emotionName, setEmotionName] = useState("neutral");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isAnalyzingRef = useRef(false);

  const { data: sessionResponse, isLoading: isDetailsLoading } =
    useSessionDetail(sessionId);
  const { mutate: endSession, isPending: isEnding } = useEndSession();
  const { mutate: startSession, isPending: isStarting } = useStartSession();
  const { data: pendingResponse, isLoading: isPendingParticipantsLoading } =
    useSessionParticipants(sessionId, "PENDING", {
      refetchInterval: 3000,
    });
  const { mutate: approveParticipant, isPending: isApproving } =
    useApproveParticipant();
  const { mutate: rejectParticipant, isPending: isRejecting } =
    useRejectParticipant();
  const sessionData = sessionResponse?.data;
  const activeSessionId = sessionData?.status === "ACTIVE" ? sessionId : "";
  const pendingParticipants = pendingResponse?.data || [];

  const liveStudentIds = useMemo(
    () =>
      liveParticipants
        .filter((participant) => participant.role === "student")
        .map((participant) => participant.id),
    [liveParticipants],
  );

  const media = useWebRTCMedia({
    sessionId: activeSessionId,
    localUserId: currentUser?.id,
    peerIds: liveStudentIds,
    shouldCreateOffers: true,
  });

  const socketApi = useSessionSocket(activeSessionId, {
    onConnect: () => setSocketMessage("Realtime connected"),
    onDisconnect: () => setSocketMessage("Realtime disconnected"),
    onConnectError: (error) => setSocketMessage(error.message),
    onParticipantJoined: (payload) => {
      setLiveParticipants((current) => upsertPresence(current, payload));
    },
    onParticipantLeft: (payload) => {
      setLiveParticipants((current) =>
        current.filter((item) => item.id !== payload.userId),
      );
    },
    onChatNew: (payload) => {
      if (payload.sessionId === sessionId) {
        setChatMessages((current) =>
          current.some((message) => message.id === payload.id)
            ? current
            : [...current, payload],
        );
      }
    },
    onError: (payload) => {
      setSocketMessage(
        typeof payload === "string" ? payload : "Realtime error",
      );
    },
    ...media.handlers,
  });

  const participants = useMemo<RoomParticipant[]>(() => {
    const teacher: RoomParticipant = {
      id: currentUser?.id || "teacher",
      name: currentUser?.fullName || "Giảng viên",
      role: "teacher",
      status: emotionStatus,
      isMuted: !media.isAudioEnabled,
    };

    const reportParticipants =
      sessionData?.participants
        ?.filter((participant) => participant.joinStatus === "APPROVED")
        .filter((participant) => liveStudentIds.includes(participant.studentId))
        .map<RoomParticipant>((participant) => ({
          id: participant.studentId,
          name: participant.fullName,
          role: "student",
          status: "normal",
          isMuted: false,
        })) || [];

    return mergeParticipants([teacher, ...reportParticipants], liveParticipants);
  }, [
    currentUser?.fullName,
    currentUser?.id,
    emotionStatus,
    liveParticipants,
    liveStudentIds,
    media.isAudioEnabled,
    sessionData?.participants,
  ]);

  useEffect(() => {
    if (sessionData?.status === "WAITING" && sessionId && !isStarting) {
      startSession(sessionId);
    }
  }, [isStarting, sessionData?.status, sessionId, startSession]);

  useEffect(() => {
    streamRef.current = media.localStream;

    if (videoRef.current && videoRef.current.srcObject !== media.localStream) {
      videoRef.current.srcObject = media.localStream;
    }
  }, [media.localStream]);

  useEffect(() => {
    if (media.mediaError) {
      setSocketMessage(media.mediaError);
    }
  }, [media.mediaError]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      captureFrameAndAnalyze();
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const captureFrameAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) return;
    if (isAnalyzingRef.current) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      isAnalyzingRef.current = true;
      const data = await aiService.detectEmotion(
        canvas.toDataURL("image/jpeg", 0.6),
      );

      if (data) {
        setEmotionStatus(data.status || "normal");
        setEmotionName(data.emotion || "neutral");
      }
    } catch (error) {
      console.warn("AI server offline:", error);
    } finally {
      isAnalyzingRef.current = false;
    }
  };

  const handleSendChat = async (event: FormEvent) => {
    event.preventDefault();
    const message = chatDraft.trim();

    if (!message || !activeSessionId) return;

    setChatDraft("");
    const ack = await socketApi.emitter.sendChatMessage({
      sessionId: activeSessionId,
      message,
    });

    if (!ack.success) {
      setSocketMessage(ack.message || "Cannot send message");
      setChatDraft(message);
    }
  };

  const handleStartMedia = async () => {
    const stream = await media.startMedia();
    if (stream) {
      setSocketMessage("Camera và micro đã sẵn sàng");
    }
  };

  const handleEndSession = () => {
    if (!sessionId) return;
    if (window.confirm("Bạn có chắc chắn muốn kết thúc buổi học này không?")) {
      endSession(sessionId, {
        onSuccess: () => navigate(ROUTES.TEACHER.DASHBOARD),
      });
    }
  };

  const handleApproveParticipant = (participantId: string) => {
    approveParticipant({ participantId, sessionId });
  };

  const handleRejectParticipant = (participantId: string) => {
    rejectParticipant({ participantId, sessionId });
  };

  if (isDetailsLoading || isStarting) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-sm font-semibold tracking-wider">
          ĐANG KÍCH HOẠT PHÒNG DẠY...
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
          onClick={() => navigate(ROUTES.TEACHER.DASHBOARD)}
          className="px-5 py-2 bg-slate-900 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-slate-800"
        >
          QUAY VỀ DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out ${showParticipants ? "w-[calc(100%-20rem)]" : "w-full"}`}
      >
        <div className="p-4 flex justify-between items-start z-10">
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-3 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
                Recording Live - CODE: {sessionData.sessionCode}
              </p>
              <h2 className="font-extrabold text-sm text-slate-200 uppercase tracking-tight">
                {sessionData.title}
              </h2>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 text-right shadow-2xl">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
              {socketMessage}
            </p>
            <p className="text-emerald-400 font-black text-xs uppercase tracking-wider">
              {emotionName} ({emotionStatus})
            </p>
            {!media.localStream && (
              <button
                type="button"
                onClick={handleStartMedia}
                className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
              >
                Bật camera & micro
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start">
          <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden h-64 relative shadow-md">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {currentUser?.fullName || "Giảng viên"}
            </div>
          </div>

          {participants
            .filter((participant) => participant.role === "student")
            .map((student) => (
              <VideoTile
                key={student.id}
                name={student.name}
                role="student"
                attentionStatus={student.status}
                isMuted={student.isMuted}
                stream={media.remoteStreams[student.id]}
              />
            ))}
        </div>

        <div className="p-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
          <div className="text-[10px] text-slate-500 font-mono tracking-widest w-1/3 uppercase font-bold">
            {new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            | EduSense Live
          </div>

          <div className="flex items-center gap-3 w-1/3 justify-center">
            <button
              type="button"
              onClick={() => media.setIsAudioEnabled(!media.isAudioEnabled)}
              className={`p-3.5 rounded-full border border-white/5 transition-colors ${
                media.isAudioEnabled
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              }`}
              title={media.isAudioEnabled ? "Tắt micro" : "Bật micro"}
            >
              {media.isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button
              type="button"
              onClick={() => media.setIsVideoEnabled(!media.isVideoEnabled)}
              className={`p-3.5 rounded-full border border-white/5 transition-colors ${
                media.isVideoEnabled
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              }`}
              title={media.isVideoEnabled ? "Tắt camera" : "Bật camera"}
            >
              {media.isVideoEnabled ? (
                <Video size={18} />
              ) : (
                <VideoOff size={18} />
              )}
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
              className="px-8 py-3.5 bg-rose-600 text-white rounded-full font-black text-xs tracking-widest hover:bg-rose-700 transition-colors shadow-lg shadow-rose-950/30 ml-2 disabled:opacity-50 uppercase"
            >
              {isEnding ? "CLOSING..." : "KẾT THÚC"}
            </button>
          </div>

          <div className="flex items-center gap-3 w-1/3 justify-end">
            <button className="flex items-center gap-2 bg-slate-900 border border-white/5 px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-wider text-slate-300 hover:bg-slate-800 transition-colors uppercase">
              <BarChart2 size={14} className="text-blue-400" /> AI Dashboard
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-3 rounded-xl border border-white/5 transition-colors ${showParticipants ? "bg-blue-600 text-white" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}
            >
              <Users size={16} />
            </button>
            <button className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
              <MessageSquare size={16} />
            </button>
            <button className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-white/5 hover:bg-slate-800 transition-colors">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-80 h-full border-l border-white/5 bg-slate-900 z-10 flex-shrink-0 flex flex-col">
        {showParticipants ? (
          <ParticipantList
            participants={participants.map((participant) => ({
              id: participant.id,
              name: participant.name,
              role: participant.role,
              isMuted: participant.isMuted,
              isVideoOff:
                participant.id === currentUser?.id
                  ? !media.isVideoEnabled
                  : !media.remoteStreams[participant.id],
            }))}
            currentUserRole="teacher"
            onClose={() => setShowParticipants(false)}
          />
        ) : (
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-800 p-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Trò chuyện
              </h3>
            </div>
            <div className="border-b border-slate-800 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus size={16} className="text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Chờ duyệt
                  </h4>
                </div>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                  {pendingParticipants.length}
                </span>
              </div>

              {isPendingParticipantsLoading ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Loader2 size={14} className="animate-spin" />
                  Đang tải yêu cầu...
                </div>
              ) : pendingParticipants.length === 0 ? (
                <p className="text-xs font-medium text-slate-500">
                  Chưa có sinh viên nào xin vào.
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3"
                    >
                      <p className="text-sm font-bold text-slate-100">
                        {participant.student?.fullName || "Sinh viên"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {participant.student?.email || "Đang chờ xác nhận"}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleApproveParticipant(participant.id)
                          }
                          disabled={isApproving || isRejecting}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={14} />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRejectParticipant(participant.id)
                          }
                          disabled={isApproving || isRejecting}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                        >
                          <X size={14} />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <p className="text-xs font-medium text-slate-500">
                  Chưa có tin nhắn trong buổi học.
                </p>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="rounded-2xl bg-slate-800 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase text-blue-300">
                      {message.user?.fullName || "Người học"}
                    </p>
                    <p className="text-sm text-slate-100">{message.message}</p>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={handleSendChat}
              className="border-t border-slate-800 p-3"
            >
              <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-2">
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-200 outline-none"
                />
                <button
                  type="submit"
                  disabled={!activeSessionId || !chatDraft.trim()}
                  className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function upsertPresence(
  participants: RoomParticipant[],
  payload: SessionPresencePayload,
): RoomParticipant[] {
  const nextParticipant: RoomParticipant = {
    id: payload.userId,
    name: payload.fullName || "Người tham gia",
    role: payload.role === "TEACHER" ? "teacher" : "student",
    status: "normal",
    isMuted: true,
  };

  return mergeParticipants(participants, [nextParticipant]);
}

function mergeParticipants(
  base: RoomParticipant[],
  incoming: RoomParticipant[],
) {
  const participantMap = new Map<string, RoomParticipant>();

  [...base, ...incoming].forEach((participant) => {
    participantMap.set(participant.id, {
      ...participantMap.get(participant.id),
      ...participant,
    });
  });

  return Array.from(participantMap.values());
}
