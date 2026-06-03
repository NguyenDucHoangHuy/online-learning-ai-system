import { useEffect, useRef, useState } from "react";
import { Brain, Meh, MicOff } from "lucide-react";

interface VideoTileProps {
  name: string;
  stream?: MediaStream | null;
  role?: "teacher" | "student";
  attentionStatus?: "focused" | "normal" | "distracted";
  isMuted?: boolean;
  isVideoOff?: boolean;
  aiPresence?: "present" | "absent";
  aiAttentionLabel?: string;
  aiEmotionLabel?: string;
  aiConfidence?: number;
}

export default function VideoTile({
  name,
  stream,
  role = "student",
  attentionStatus = "normal",
  isMuted = false,
  isVideoOff = false,
  aiPresence,
  aiAttentionLabel,
  aiEmotionLabel,
  aiConfidence,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [absentNoticeVisible, setAbsentNoticeVisible] = useState(false);
  const isAiAbsent = aiPresence === "absent";
  const shouldShowVideo = !!stream && !isVideoOff;
  const effectiveAttentionStatus =
    isAiAbsent && !absentNoticeVisible ? "normal" : attentionStatus;
  const placeholderText = isVideoOff
    ? "Camera \u0111\u00e3 t\u1eaft"
    : "\u0110ang k\u1ebft n\u1ed1i...";

  const focusLabel =
    isAiAbsent && absentNoticeVisible
      ? "V\u1eafng m\u1eb7t"
      : effectiveAttentionStatus === "distracted"
        ? "Kh\u00f4ng t\u1eadp trung"
        : effectiveAttentionStatus === "focused"
          ? "T\u1eadp trung"
          : isAiAbsent
            ? "\u0110ang ph\u00e2n t\u00edch"
            : aiAttentionLabel || "\u0110ang ph\u00e2n t\u00edch";

  const focusBadgeClass =
    (isAiAbsent && absentNoticeVisible) ||
    effectiveAttentionStatus === "distracted"
      ? "bg-rose-600/95 text-white border-rose-400/40"
      : effectiveAttentionStatus === "focused"
        ? "bg-emerald-500/95 text-slate-950 border-emerald-300/50"
        : "bg-slate-950/75 text-slate-200 border-white/10";

  const isLowConfidence =
    typeof aiConfidence === "number" && aiConfidence > 0 && aiConfidence < 0.28;
  const emotionValue = isLowConfidence
    ? "Ch\u01b0a r\u00f5"
    : isAiAbsent
      ? "\u0110ang ph\u00e2n t\u00edch"
      : aiEmotionLabel || "\u0110ang ph\u00e2n t\u00edch";
  const emotionLabel =
    !isVideoOff && !(isAiAbsent && absentNoticeVisible)
      ? `C\u1ea3m x\u00fac: ${emotionValue}`
      : null;

  const emotionBadgeClass =
    aiEmotionLabel && !isLowConfidence && effectiveAttentionStatus === "distracted"
      ? "bg-amber-500/95 text-slate-950 border-amber-300/50"
      : "bg-slate-950/75 text-slate-100 border-white/10";

  useEffect(() => {
    if (!isAiAbsent) return;

    setAbsentNoticeVisible(true);
    const timerId = window.setTimeout(() => {
      setAbsentNoticeVisible(false);
    }, 2000);

    return () => window.clearTimeout(timerId);
  }, [isAiAbsent, aiConfidence]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
      if (stream) {
        void videoRef.current.play().catch(() => undefined);
      }
    }
  }, [stream]);

  const getBorderColor = () => {
    if (role === "teacher") return "border-blue-500/50";
    switch (effectiveAttentionStatus) {
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
      {stream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover ${shouldShowVideo ? "" : "absolute inset-0 opacity-0 pointer-events-none"} ${role === "teacher" ? "" : "scale-x-[-1]"}`}
        />
      )}

      {!shouldShowVideo && (
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-white/5 shadow-inner text-slate-300 text-xl font-black uppercase">
            {(name || "?").charAt(0)}
          </div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
            {placeholderText}
          </p>
        </div>
      )}

      {!isVideoOff && (
        <div
          className={`absolute top-4 right-4 z-10 pointer-events-none flex max-w-[58%] items-center gap-1.5 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md ${focusBadgeClass}`}
        >
          <Brain size={13} className="shrink-0" />
          <span className="truncate text-[10px] font-black uppercase tracking-widest">
            {focusLabel}
          </span>
        </div>
      )}

      {emotionLabel && (
        <div
          className={`absolute top-4 left-4 z-10 pointer-events-none flex max-w-[46%] items-center gap-1.5 rounded-xl border px-3 py-2 shadow-lg backdrop-blur-md ${emotionBadgeClass}`}
        >
          <Meh size={13} className="shrink-0" />
          <span className="truncate text-[10px] font-black uppercase tracking-widest">
            {emotionLabel}
          </span>
        </div>
      )}

      {absentNoticeVisible && !isVideoOff && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-slate-950/35 backdrop-blur-[1px]">
          <div className="rounded-2xl border border-rose-400/40 bg-rose-600/95 px-5 py-3 text-center text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest">
              V\u1eafng m\u1eb7t
            </p>
            <p className="mt-1 text-[10px] font-semibold text-rose-50/90">
              Kh\u00f4ng ph\u00e1t hi\u1ec7n khu\u00f4n m\u1eb7t
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex flex-col z-10 pointer-events-none max-w-[calc(100%-5rem)]">
        <span className="text-xs font-semibold text-white tracking-wide bg-black/60 px-2.5 py-1.5 rounded-xl backdrop-blur-md w-fit max-w-full truncate border border-white/5">
          {name} {role === "teacher" && "(Gi\u1ea3ng vi\u00ean)"}
        </span>
      </div>

      {isMuted && (
        <div className="absolute bottom-4 right-4 bg-rose-600/90 text-white border border-rose-500/30 p-2 rounded-xl backdrop-blur-md z-10 pointer-events-none flex items-center justify-center shadow-lg animate-in fade-in zoom-in duration-200">
          <MicOff size={14} className="text-white" />
        </div>
      )}
    </div>
  );
}
