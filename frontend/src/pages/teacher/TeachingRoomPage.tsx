import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  Mic,
  Video,
  Monitor,
  BarChart2,
  Users,
  BrainCircuit,
  UserX,
  AlertCircle,
} from "lucide-react";
import VideoTile from "../../components/ui/VideoTile";
import ParticipantList from "../../components/ui/ParticipantList";

const initialStudents = [
  { id: 1, name: "Quốc Anh", status: "focused" as const, isMuted: true },
  { id: 2, name: "Công Đức", status: "normal" as const, isMuted: true },
  { id: 3, name: "Nguyễn Văn A", status: "distracted" as const, isMuted: true },
];

export default function TeachingRoomPage() {
  const [showParticipants, setShowParticipants] = useState(false);
  const [students] = useState(initialStudents);

  const [myEmotion, setMyEmotion] = useState("Đang khởi động...");
  const [myStatus, setMyStatus] = useState<
    "focused" | "normal" | "distracted" | "away"
  >("normal");
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const webcamRef = useRef<Webcam>(null);

  // Ref để theo dõi thời gian không thấy mặt
  const faceMissingSince = useRef<number | null>(null);

  const analyzeFrame = useCallback(async () => {
    if (isAiProcessing || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      setIsAiProcessing(true);
      const response = await axios.post("http://localhost:8000/analyze", {
        image: imageSrc,
      });

      const { status, emotion } = response.data;

      // LOGIC XỬ LÝ THỜI GIAN KHÔNG THẤY MẶT
      if (status === "Away") {
        if (faceMissingSince.current === null) {
          faceMissingSince.current = Date.now();
        }

        const secondsMissing = (Date.now() - faceMissingSince.current) / 1000;

        if (secondsMissing >= 6) {
          // Sau 6 giây -> Vắng mặt
          setMyStatus("away");
          setMyEmotion("Vắng mặt");
        } else if (secondsMissing >= 1) {
          // Sau  giây -> Cảnh báo không tập trung
          setMyStatus("distracted");
          setMyEmotion("Không tìm thấy mặt");
        }
        // Nếu < 2 giây, giữ nguyên trạng thái cũ để tránh nhấp nháy
      } else {
        // Nếu thấy mặt trở lại -> Reset timer
        faceMissingSince.current = null;
        setMyEmotion(emotion);

        if (status === "Focusing") {
          setMyStatus("focused");
        } else if (status === "Distracted") {
          setMyStatus("distracted");
        } else {
          setMyStatus("normal");
        }
      }
    } catch {
      console.error("AI Server Connection Error");
      setMyEmotion("AI Offline");
    } finally {
      setIsAiProcessing(false);
    }
  }, [isAiProcessing]);

  useEffect(() => {
    const interval = setInterval(analyzeFrame, 1000);
    return () => clearInterval(interval);
  }, [analyzeFrame]);

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out ${showParticipants ? "w-[calc(100%-20rem)]" : "w-full"}`}
      >
        {/* TOP INFO BAR */}
        <div className="p-4 flex justify-between items-start">
          <div className="bg-slate-900/80 backdrop-blur-md p-3 px-5 rounded-2xl border border-slate-800 flex items-center gap-4 shadow-xl">
            <div className="relative">
              <div
                className={`w-3 h-3 rounded-full ${myStatus === "away" ? "bg-rose-500" : "bg-emerald-500"}`}
              />
              <div
                className={`absolute inset-0 w-3 h-3 rounded-full ${myStatus === "away" ? "bg-rose-500" : "bg-emerald-400"} animate-ping`}
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                EduSense AI Engine
              </p>
              <h2 className="font-bold text-sm text-slate-200">
                {myStatus === "away"
                  ? "HỆ THỐNG: VẮNG MẶT"
                  : `TRẠNG THÁI: ${myStatus.toUpperCase()}`}
              </h2>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-3 px-5 rounded-2xl border border-slate-800 text-right shadow-xl">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
              Cảm xúc hiện tại
            </p>
            <p className="text-blue-400 font-black text-sm uppercase tracking-widest">
              {myEmotion}
            </p>
          </div>
        </div>

        {/* VIDEO GRID */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          <div
            className={`relative aspect-video rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 shadow-2xl bg-slate-900 ${
              myStatus === "focused"
                ? "border-emerald-500/40 shadow-emerald-900/10"
                : myStatus === "distracted"
                  ? "border-amber-500 shadow-amber-900/40"
                  : myStatus === "away"
                    ? "border-rose-600 shadow-rose-900/40"
                    : "border-slate-800"
            }`}
          >
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={true}
              className={`w-full h-full object-cover transition-all duration-700 ${
                myStatus === "away"
                  ? "blur-2xl grayscale opacity-30 scale-110"
                  : myStatus === "distracted"
                    ? "blur-md brightness-50"
                    : "opacity-100 scale-100"
              }`}
            />

            {/* OVERLAY VẮNG MẶT (6s) */}
            {myStatus === "away" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/20 backdrop-blur-sm">
                <UserX size={60} className="text-rose-500 mb-2 animate-pulse" />
                <p className="text-rose-500 font-black tracking-[0.3em] text-xl">
                  VẮNG MẶT
                </p>
              </div>
            )}

            {/* OVERLAY KHÔNG TẬP TRUNG (2s) */}
            {myStatus === "distracted" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-950/30 backdrop-blur-sm">
                <AlertCircle
                  size={60}
                  className="text-amber-400 mb-2 animate-bounce"
                />
                <p className="text-amber-400 font-black tracking-[0.1em] text-xl uppercase">
                  Không tập trung
                </p>
                <p className="text-amber-200/60 text-[10px] font-bold uppercase mt-1">
                  Tập trung
                </p>
              </div>
            )}

            <div className="absolute bottom-5 left-5 flex items-center gap-2 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/5">
              <BrainCircuit size={16} className="text-blue-400" />
              <span className="text-[11px] font-black uppercase tracking-tighter text-white/90">
                AI Live: {myEmotion}
              </span>
            </div>
          </div>

          {students.map((student) => (
            <VideoTile
              key={student.id}
              name={student.name}
              attentionStatus={student.status}
              isMuted={student.isMuted}
            />
          ))}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="p-6 bg-slate-950 border-t border-slate-900/50 flex items-center justify-between">
          <div className="text-[10px] text-slate-500 font-mono tracking-widest w-1/3">
            {new Date().toLocaleTimeString("vi-VN")} | EDUMIND ENGINE v2.0
          </div>

          <div className="flex items-center gap-4 w-1/3 justify-center">
            <button className="p-4 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all">
              <Mic size={20} />
            </button>
            <button className="p-4 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all">
              <Video size={20} />
            </button>
            <button className="p-4 bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 hover:bg-slate-800 transition-all">
              <Monitor size={20} />
            </button>
            <button className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs tracking-[0.2em] hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20 ml-2">
              KẾT THÚC
            </button>
          </div>

          <div className="flex items-center gap-3 w-1/3 justify-end">
            <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl text-xs font-black text-slate-300 hover:bg-slate-800 transition-all">
              <BarChart2 size={18} className="text-blue-400" /> THỐNG KÊ AI
            </button>
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-4 rounded-2xl transition-all border ${showParticipants ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/20 text-white" : "bg-slate-900 border-slate-800 text-slate-300"}`}
            >
              <Users size={20} />
            </button>
          </div>
        </div>
      </div>

      {showParticipants && (
        <div className="w-80 h-full border-l border-slate-800 bg-slate-900 z-10 flex-shrink-0 animate-in slide-in-from-right-8 duration-500">
          <ParticipantList
            participants={[
              {
                id: "t1",
                name: "Hoàng Huy (Bạn)",
                role: "teacher",
                isMuted: false,
                isVideoOff: false,
              },
              ...students.map((s) => ({
                id: String(s.id),
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
    </div>
  );
}
