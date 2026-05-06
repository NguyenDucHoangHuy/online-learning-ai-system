import { Mic, MicOff, Video, VideoOff, MoreVertical, X } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  role: "teacher" | "student";
  isMuted: boolean;
  isVideoOff: boolean;
}

interface ParticipantListProps {
  participants: Participant[];
  currentUserRole: "teacher" | "student";
  onClose: () => void;
}

export default function ParticipantList({
  participants,
  currentUserRole,
  onClose,
}: ParticipantListProps) {
  // Tách giảng viên và sinh viên ra để hiển thị giảng viên lên đầu
  const teachers = participants.filter((p) => p.role === "teacher");
  const students = participants.filter((p) => p.role === "student");

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-80 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h3 className="font-semibold text-sm text-slate-200">
          Người tham gia ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Danh sách */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Nhóm Giảng viên */}
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-2 mb-2">
            Giảng viên
          </p>
          {teachers.map((t) => (
            <ParticipantItem
              key={t.id}
              participant={t}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>

        {/* Nhóm Sinh viên */}
        <div>
          <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider px-2 mb-2">
            Sinh viên
          </p>
          {students.map((s) => (
            <ParticipantItem
              key={s.id}
              participant={s}
              currentUserRole={currentUserRole}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Component phụ để hiển thị từng dòng
function ParticipantItem({
  participant,
  currentUserRole,
}: {
  participant: Participant;
  currentUserRole: "teacher" | "student";
}) {
  return (
    <div className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded-lg group transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center font-semibold text-xs border border-blue-500/30">
          {participant.name.charAt(0)}
        </div>
        <span className="text-sm text-slate-300 truncate max-w-[120px]">
          {participant.name}
        </span>
      </div>

      <div className="flex items-center gap-2 text-slate-500">
        {participant.isMuted ? (
          <MicOff size={16} className="text-rose-500/70" />
        ) : (
          <Mic size={16} />
        )}
        {participant.isVideoOff ? (
          <VideoOff size={16} className="text-rose-500/70" />
        ) : (
          <Video size={16} />
        )}

        {/* Nút thao tác chỉ hiện với Giảng viên và trên dòng của Sinh viên */}
        {currentUserRole === "teacher" && participant.role === "student" && (
          <button className="p-1 opacity-0 group-hover:opacity-100 hover:text-slate-300 transition-all">
            <MoreVertical size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
