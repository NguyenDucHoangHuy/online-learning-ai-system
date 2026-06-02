// src/components/ui/VideoTile.tsx
import { useEffect, useRef } from "react";
import { MicOff, User } from "lucide-react";

interface VideoTileProps {
  name: string;
  stream?: MediaStream | null; // 🎯 FIX CHỐT: Khai báo thêm prop stream để dập tắt vĩnh viễn lỗi TS(2322) từ trang cha
  role?: "teacher" | "student";
  attentionStatus?: "focused" | "normal" | "distracted";
  isMuted?: boolean;
}

export default function VideoTile({
  name,
  stream,
  role = "student",
  attentionStatus = "normal",
  isMuted = false, // 🎯 SỬA: Đổi mặc định thành false (mặc định vào lớp là mic đang mở)
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  const getBorderColor = () => {
    if (role === "teacher") return "border-blue-500/50";
    switch (attentionStatus) {
      case "focused":
        return "border-emerald-500/50";
      case "distracted":
        return "border-rose-500/50 ring-2 ring-rose-500/10 animate-pulse";
      default:
        return "border-slate-800";
    }
  };

  return (
    <div
      className={`aspect-video bg-slate-900 rounded-3xl border-2 ${getBorderColor()} relative overflow-hidden flex items-center justify-center group shadow-md transition-all duration-300`}
    >
      {/* 📹 LUỒNG VIDEO */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted} // Đồng bộ tiếng theo điều phối của trang cha
          className={`w-full h-full object-cover ${role === "teacher" ? "" : "scale-x-[-1]"}`}
        />
      ) : (
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner">
            <User size={32} className="text-slate-600" />
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
            Connecting Media...
          </p>
        </div>
      )}

      {/* Badge thông tin người dùng góc trái */}
      <div className="absolute bottom-4 left-4 flex flex-col z-10 pointer-events-none">
        <span className="text-xs font-semibold text-white tracking-wide bg-black/60 px-2.5 py-1.5 rounded-xl backdrop-blur-md w-fit border border-white/5 flex items-center gap-1.5">
          {name} {role === "teacher" && "(Giảng viên)"}
        </span>
      </div>

      {/* 🎯 BADGE TRẠNG THÁI MIC GÓC PHẢI - ĐÃ ĐƯỢC BO GÓC VÀ ĐẬM ĐÀ CHUẨN GOOGLE MEET */}
      {isMuted && (
        <div className="absolute bottom-4 right-4 bg-rose-600/90 text-white border border-rose-500/30 p-2 rounded-xl backdrop-blur-md z-10 pointer-events-none flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
          <MicOff size={14} className="text-white" />
        </div>
      )}
    </div>
  );
}
