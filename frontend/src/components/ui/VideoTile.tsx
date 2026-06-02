// src/components/ui/VideoTile.tsx
import { useEffect, useRef } from "react";
import { MicOff, User, VideoOff } from "lucide-react";

interface VideoTileProps {
  name: string;
  role?: "teacher" | "student";
  attentionStatus?: "focused" | "normal" | "distracted";
  isMuted?: boolean;
  stream?: MediaStream | null;
  isLocal?: boolean;
}

export default function VideoTile({
  name,
  role = "student",
  attentionStatus = "normal",
  isMuted = true,
  stream,
  isLocal = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream ?? null;
    }
  }, [stream]);

  // Xác định màu viền dựa trên trạng thái AI
  const getBorderColor = () => {
    if (role === "teacher") return "border-blue-500/50"; // Viền xanh dương cho GV
    switch (attentionStatus) {
      case "focused":
        return "border-emerald-500/50"; // Xanh lá: Tập trung
      case "distracted":
        return "border-rose-500/50"; // Đỏ: Mất tập trung
      default:
        return "border-slate-800"; // Xám: Bình thường
    }
  };

  return (
    <div
      className={`aspect-video bg-slate-900 rounded-3xl border-2 ${getBorderColor()} relative overflow-hidden flex items-center justify-center group`}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <User size={32} />
          </div>
          <VideoOff size={18} />
        </div>
      )}

      {/* Thông tin người dùng */}
      <div className="absolute bottom-4 left-4 flex flex-col">
        <span className="text-xs font-semibold text-white tracking-wide bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm w-fit">
          {name} {role === "teacher" && "(Giảng viên)"}
        </span>
        {role === "teacher" && (
          <span className="text-[10px] text-emerald-400 font-medium mt-1 ml-1 tracking-wider uppercase">
            Presenter
          </span>
        )}
      </div>

      {/* Trạng thái Mic */}
      {isMuted && (
        <div className="absolute bottom-4 right-4 bg-rose-500/20 text-rose-500 p-1.5 rounded-full backdrop-blur-sm">
          <MicOff size={14} />
        </div>
      )}
    </div>
  );
}
