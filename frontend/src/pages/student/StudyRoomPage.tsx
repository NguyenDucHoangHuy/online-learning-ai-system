// src/pages/student/StudyRoomPage.tsx
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BrainCircuit,
  Hand,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  Send,
  ShieldAlert,
  Users,
  Video,
  VideoOff,
} from "lucide-react";

import ParticipantList from "../../components/ui/ParticipantList";
import VideoTile from "../../components/ui/VideoTile";
import { ROUTES } from "../../constants";
import { useWebRTCMedia } from "../../hooks/useWebRTCMedia";
import { useSessionDetail } from "../../services/sessions/sessions.queries";
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

export default function StudyRoomPage() {
  const { sessionId = "" } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [liveParticipants, setLiveParticipants] = useState<RoomParticipant[]>(
    [],
  );
  const [socketMessage, setSocketMessage] = useState("Connecting realtime...");

  const { data: sessionResponse, isLoading } = useSessionDetail(sessionId);
  const sessionData = sessionResponse?.data;
  const activeSessionId = sessionData?.status === "ACTIVE" ? sessionId : "";
  const teacherId = sessionData?.class.teacherId || "";

  const media = useWebRTCMedia({
    sessionId: activeSessionId,
    localUserId: currentUser?.id,
    peerIds: teacherId ? [teacherId] : [],
    shouldCreateOffers: false,
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
        current.filter((participant) => participant.id !== payload.userId),
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
      id: sessionData?.class.teacherId || "teacher",
      name: "Giảng viên",
      role: "teacher",
      status: "normal",
      isMuted: false,
    };

    const me: RoomParticipant = {
      id: currentUser?.id || "me",
      name: currentUser?.fullName || "Bạn",
      role: "student",
      status: "focused",
      isMuted: !media.isAudioEnabled,
    };

    return mergeParticipants([teacher, me], liveParticipants);
  }, [
    currentUser?.fullName,
    currentUser?.id,
    liveParticipants,
    media.isAudioEnabled,
    sessionData?.class.teacherId,
  ]);

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

  const handleLeaveRoom = async () => {
    if (activeSessionId) {
      await socketApi.emitter.leaveSession(activeSessionId);
    }

    navigate(ROUTES.STUDENT.JOIN);
  };

  useEffect(() => {
    if (media.mediaError) {
      setSocketMessage(media.mediaError);
    }
  }, [media.mediaError]);

  if (isLoading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="animate-spin text-blue-500" size={40} />
        <p className="text-sm font-semibold tracking-wider">
          ĐANG VÀO PHÒNG HỌC...
        </p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400 p-4">
        <ShieldAlert className="text-rose-500" size={48} />
        <p className="text-base font-bold">
          Không tìm thấy phòng học hoặc bạn chưa được duyệt vào phòng.
        </p>
        <button
          onClick={() => navigate(ROUTES.STUDENT.JOIN)}
          className="px-5 py-2 bg-slate-900 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-slate-800"
        >
          QUAY VỀ NHẬP MÃ
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
        <div className="absolute top-8 left-8 z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/50 shadow-lg">
          <h2 className="font-semibold text-sm">{sessionData.title}</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {socketMessage}
          </p>
          {!media.localStream && (
            <button
              type="button"
              onClick={handleStartMedia}
              className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white"
            >
              Bật camera & micro
            </button>
          )}
        </div>

        <div className="flex-1 w-full h-full flex flex-col gap-4 mt-16 overflow-hidden">
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
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="w-64 flex-shrink-0 snap-start"
                  >
                    <VideoTile
                      name={participant.name}
                      role={participant.role}
                      attentionStatus={participant.status}
                      isMuted={participant.isMuted}
                      stream={
                        participant.id === currentUser?.id
                          ? media.localStream
                          : media.remoteStreams[participant.id]
                      }
                      isLocal={participant.id === currentUser?.id}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-center px-4">
              {participants.map((participant) => (
                <VideoTile
                  key={participant.id}
                  name={participant.name}
                  role={participant.role}
                  attentionStatus={participant.status}
                  isMuted={participant.isMuted}
                  stream={
                    participant.id === currentUser?.id
                      ? media.localStream
                      : media.remoteStreams[participant.id]
                  }
                  isLocal={participant.id === currentUser?.id}
                />
              ))}
            </div>
          )}
        </div>

        <div className="h-20 mt-4 flex items-center justify-center gap-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => media.setIsAudioEnabled(!media.isAudioEnabled)}
            className={`p-4 rounded-full transition-colors ${
              media.isAudioEnabled
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30"
            }`}
            title={media.isAudioEnabled ? "Tắt micro" : "Bật micro"}
          >
            {media.isAudioEnabled ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            type="button"
            onClick={() => media.setIsVideoEnabled(!media.isVideoEnabled)}
            className={`p-4 rounded-full transition-colors ${
              media.isVideoEnabled
                ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                : "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30"
            }`}
            title={media.isVideoEnabled ? "Tắt camera" : "Bật camera"}
          >
            {media.isVideoEnabled ? (
              <Video size={22} />
            ) : (
              <VideoOff size={22} />
            )}
          </button>
          <button className="p-4 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
            <Hand size={22} />
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-4 rounded-full transition-colors ${isScreenSharing ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            title="Bật/Tắt chia sẻ màn hình"
          >
            <MonitorUp size={22} />
          </button>

          <button
            onClick={handleLeaveRoom}
            className="px-8 py-4 bg-rose-600 text-white rounded-full font-bold text-sm tracking-wider hover:bg-rose-700 transition-colors shadow-lg ml-4"
          >
            RỜI PHÒNG
          </button>
        </div>
      </div>

      <div className="w-72 lg:w-80 hidden md:flex flex-col bg-slate-900 border-l border-slate-800 z-10 flex-shrink-0 transition-all">
        <div className="p-4 border-b border-slate-800">
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-2xl p-4 flex items-start gap-3">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 flex-shrink-0">
              <BrainCircuit size={20} />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
                AI Phân tích
              </p>
              <p className="text-sm font-medium text-emerald-400">
                Trạng thái: Đang theo dõi
              </p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "chat"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <MessageSquare size={16} /> Trò chuyện
          </button>
          <button
            onClick={() => setActiveTab("participants")}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "participants"
                ? "text-blue-400 border-b-2 border-blue-400 bg-slate-800/30"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Users size={16} /> Mọi người
          </button>
        </div>

        {activeTab === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <p className="text-xs font-medium text-slate-500">
                  Chưa có tin nhắn trong buổi học.
                </p>
              ) : (
                chatMessages.map((message) => (
                  <div key={message.id} className="flex flex-col gap-1">
                    <span className="text-xs text-blue-400 font-medium">
                      {message.user?.fullName || "Người học"}
                    </span>
                    <p className="text-sm bg-slate-800 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl w-fit text-slate-200 shadow-sm">
                      {message.message}
                    </p>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={handleSendChat}
              className="p-4 bg-slate-900 border-t border-slate-800"
            >
              <div className="bg-slate-950 rounded-xl border border-slate-800 flex items-center p-2">
                <input
                  type="text"
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-transparent border-none text-sm px-2 focus:outline-none text-slate-200"
                />
                <button
                  type="submit"
                  disabled={!activeSessionId || !chatDraft.trim()}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ParticipantList
              participants={participants.map((participant) => ({
                id: participant.id,
                name: participant.name,
                role: participant.role,
                isMuted: participant.isMuted,
                isVideoOff: false,
              }))}
              currentUserRole="student"
              onClose={() => setActiveTab("chat")}
            />
          </div>
        )}
      </div>
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
