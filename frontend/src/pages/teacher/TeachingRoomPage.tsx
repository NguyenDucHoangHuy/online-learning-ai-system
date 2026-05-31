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
  Loader2,
  ShieldAlert,
} from "lucide-react";

import VideoTile from "../../components/ui/VideoTile";
import ParticipantList from "../../components/ui/ParticipantList";
import {
  useSessionDetail,
  useEndSession,
} from "../../services/sessions/sessions.queries";
import { aiService } from "../../services/ai/ai.service";
import { ROUTES } from "../../constants";

const mockStudents = [
  { id: "1", name: "Quốc Anh", status: "focused" as const, isMuted: true },
  { id: "2", name: "Công Đức", status: "normal" as const, isMuted: true },
  {
    id: "3",
    name: "Nguyễn Văn A",
    status: "distracted" as const,
    isMuted: true,
  },
  { id: "4", name: "Trần Thị B", status: "focused" as const, isMuted: true },
];

export default function TeachingRoomPage() {
  // 🎯 FIX 1: Thống nhất lấy sessionId làm Khóa chính (ID thô từ DB) để fetch dữ liệu chuẩn REST
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [showParticipants, setShowParticipants] = useState(false);

  // --- 📡 CONNECT DATABASE LAYER ---
  const { data: sessionResponse, isLoading: isDetailsLoading } =
    useSessionDetail(sessionId || "");
  const { mutate: endSession, isPending: isEnding } = useEndSession();
  const sessionData = sessionResponse?.data;

  // --- 🤖 AI REAL-TIME STATES & LOCKS ---
  const [emotionStatus, setEmotionStatus] = useState<
    "focused" | "normal" | "distracted"
  >("normal");
  const [emotionName, setEmotionName] = useState("neutral");

  // 🎯 FIX 4: Concurrency Lock chặn đứng tình trạng Request gối đầu, chống overlap khi Flask xử lý chậm
  const isAnalyzingRef = useRef(false);

  // 🎯 FIX 5: Chuyển mảng Mock sang State, dọn đường sẵn để Phase 3 chỉ cần setParticipants(socketData) là ăn tiền
  const [participants, setParticipants] = useState(mockStudents);

  // --- 🎥 LIFECYCLE REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🎯 FIX 3: Găm luồng Stream vào Ref để quản lý vòng đời camera an toàn tuyệt đối, không sợ leak bộ nhớ
  const streamRef = useRef<MediaStream | null>(null);

  // Kích hoạt mở Webcam của Giảng viên khi xác thực phòng thành công
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        streamRef.current = stream; // Lưu vết xịn vào Ref
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("🚨 Lỗi truy cập Camera:", error);
      }
    }

    if (!isDetailsLoading && sessionData) {
      startCamera();
    }

    // 🎯 CLEANUP LIFECYCLE: Tự động dập tắt mọi Track của Camera khi Giảng viên thoát phòng dạy
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isDetailsLoading, sessionData]);

  // Hàm chụp khung hình ngầm và bắn sang cổng AI Service
  const captureFrameAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) return;

    // Nếu rào chắn đang khóa (Request trước đó chưa xử lý xong) -> Bỏ qua chu kỳ quét này
    if (isAnalyzingRef.current) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.6);

    try {
      isAnalyzingRef.current = true; // 🔒 KHÓA CỔNG

      // 🎯 FIX 2 & 8: Gọi qua lớp lang Service sạch sẽ, triệt tiêu hoàn toàn axios thô inside page
      const data = await aiService.detectEmotion(imageData);
      if (data) {
        setEmotionStatus(data.status || "normal");
        setEmotionName(data.emotion || "neutral");
      }
    } catch (error) {
      // Giữ nguyên log cảnh báo ngầm, không làm sập luồng UI
      console.warn("⚠️ AI server offline:", error);
    } finally {
      isAnalyzingRef.current = false; // 🔓 MỞ KHÓA cho chu kỳ tiếp theo
    }
  };

  // Vòng lặp kích hoạt quét AI mỗi 5 giây tự động
  useEffect(() => {
    const interval = setInterval(() => {
      captureFrameAndAnalyze();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Xử lý kết thúc buổi học
  const handleEndSession = () => {
    if (!sessionId) return;
    if (
      window.confirm(
        "Bạn có chắc chắn muốn kết thúc buổi học này và đóng phòng dạy không?",
      )
    ) {
      endSession(sessionId, {
        onSuccess: () => {
          // 🎯 FIX 6: Điều hướng Giảng viên quay trở lại trang Dashboard/Quản lý lớp học tập trung
          navigate(ROUTES.TEACHER.DASHBOARD);
        },
      });
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
      {/* MAIN CONTAINER */}
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out ${showParticipants ? "w-[calc(100%-20rem)]" : "w-full"}`}
      >
        {/* TOP BAR */}
        <div className="p-4 flex justify-between items-start z-10">
          <div className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex items-center gap-3 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
            <div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
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
          {/* WEBCAM GIẢNG VIÊN */}
          <div className="bg-slate-900 rounded-[2rem] border border-white/5 overflow-hidden h-64 relative shadow-md">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute bottom-4 left-4 bg-slate-950/70 backdrop-blur px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Hoàng
              Huy (Giảng viên)
            </div>
          </div>

          {/* AI TEST TILES */}
          <VideoTile
            name="AI Student Engine"
            attentionStatus={emotionStatus}
            isMuted={false}
          />

          {/* MAP DANH SÁCH SINH VIÊN TỪ STATE BIẾN ĐỘNG */}
          {participants.map((student) => (
            <VideoTile
              key={student.id}
              name={student.name}
              attentionStatus={student.status}
              isMuted={student.isMuted}
            />
          ))}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="p-5 flex items-center justify-between bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
          <div className="text-[10px] text-slate-500 font-mono tracking-widest w-1/3 uppercase font-bold">
            {new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            | EduSense Live
          </div>

          <div className="flex items-center gap-3 w-1/3 justify-center">
            <button className="p-3.5 bg-slate-900 text-slate-300 rounded-full hover:bg-slate-800 border border-white/5 transition-colors">
              <Mic size={18} />
            </button>
            <button className="p-3.5 bg-slate-900 text-slate-300 rounded-full hover:bg-slate-800 border border-white/5 transition-colors">
              <Video size={18} />
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

      {/* SIDEBAR */}
      {showParticipants && (
        <div className="w-80 h-full border-l border-white/5 bg-slate-900 z-10 flex-shrink-0 animate-in slide-in-from-right-8 duration-300">
          <ParticipantList
            participants={[
              {
                id: "t1",
                name: "Hoàng Huy",
                role: "teacher",
                isMuted: false,
                isVideoOff: false,
              },
              ...participants.map((s) => ({
                id: s.id,
                name: s.name,
                role: "student" as const,
                isMuted: s.isMuted,
                isVideoOff: false,
              })),
            ]}
            currentUserRole="teacher"
            onClose={() => setShowParticipants(false)}
          />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
