// src/pages/student/StudyRoomPage.tsx
import { useState } from "react";
import {
  MicOff,
  Video,
  Hand,
  MessageSquare,
  BrainCircuit,
  Send,
  User,
  Users,
  MonitorUp, // Thêm icon chia sẻ màn hình
} from "lucide-react";
import ParticipantList from "../../components/ui/ParticipantList";
import VideoTile from "../../components/ui/VideoTile"; // Tận dụng lại component VideoTile

// Data mẫu sinh viên trong phòng (Sử dụng tên team của bạn)
const mockParticipants = [
  {
    id: "t1",
    name: "Giảng viên",
    role: "teacher" as const,
    status: "normal" as const,
    isMuted: false,
  },
  {
    id: "s1",
    name: "Bạn (Hoàng Huy)",
    role: "student" as const,
    status: "focused" as const,
    isMuted: true,
  },
  {
    id: "s2",
    name: "Quốc Anh",
    role: "student" as const,
    status: "focused" as const,
    isMuted: true,
  },
  {
    id: "s3",
    name: "Công Đức",
    role: "student" as const,
    status: "normal" as const,
    isMuted: false,
  },
  {
    id: "s4",
    name: "Sinh viên A",
    role: "student" as const,
    status: "distracted" as const,
    isMuted: true,
  },
];

export default function StudyRoomPage() {
  const [activeTab, setActiveTab] = useState<"chat" | "participants">("chat");
  // State quản lý việc có đang chia sẻ màn hình hay không
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  return (
    <div className="h-screen bg-slate-950 text-white flex font-sans overflow-hidden">
      {/* KHU VỰC CHÍNH: Video Area */}
      <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
        {/* Top Info */}
        <div className="absolute top-8 left-8 z-10 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/50 shadow-lg">
          <h2 className="font-semibold text-sm">
            Đồ án Chuyên ngành 1 - Nhóm 1
          </h2>
        </div>

        {/* LOGIC HIỂN THỊ CAMERA VÀ MÀN HÌNH CHIA SẺ */}
        <div className="flex-1 w-full h-full flex flex-col gap-4 mt-16 overflow-hidden">
          {isScreenSharing ? (
            // TRẠNG THÁI 1: CÓ CHIA SẺ MÀN HÌNH
            <>
              {/* Màn hình chia sẻ lớn ở trên */}
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

              {/* Hàng camera nhỏ ở dưới */}
              <div className="h-40 flex gap-4 overflow-x-auto overflow-y-hidden pb-2 snap-x">
                {mockParticipants.map((p) => (
                  <div key={p.id} className="w-64 flex-shrink-0 snap-start">
                    <VideoTile
                      name={p.name}
                      role={p.role}
                      attentionStatus={p.status}
                      isMuted={p.isMuted}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            // TRẠNG THÁI 2: KHÔNG CHIA SẺ MÀN HÌNH (GRID VIEW NHƯ GOOGLE MEET)
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-center px-4">
              {mockParticipants.map((p) => (
                <VideoTile
                  key={p.id}
                  name={p.name}
                  role={p.role}
                  attentionStatus={p.status}
                  isMuted={p.isMuted}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="h-20 mt-4 flex items-center justify-center gap-4 flex-shrink-0">
          <button className="p-4 bg-rose-500/20 text-rose-500 rounded-full hover:bg-rose-500/30 transition-colors">
            <MicOff size={22} />
          </button>
          <button className="p-4 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
            <Video size={22} />
          </button>
          <button className="p-4 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
            <Hand size={22} />
          </button>

          {/* Nút test tính năng chia sẻ màn hình */}
          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`p-4 rounded-full transition-colors ${isScreenSharing ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            title="Bật/Tắt chia sẻ màn hình (Test UI)"
          >
            <MonitorUp size={22} />
          </button>

          <button className="px-8 py-4 bg-rose-600 text-white rounded-full font-bold text-sm tracking-wider hover:bg-rose-700 transition-colors shadow-lg ml-4">
            RỜI PHÒNG
          </button>
        </div>
      </div>

      {/* KHU VỰC SIDEBAR: AI + Chat/Participants (Giữ nguyên) */}
      <div className="w-72 lg:w-80 hidden md:flex flex-col bg-slate-900 border-l border-slate-800 z-10 flex-shrink-0 transition-all">
        {/* AI Insight Card */}
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
                Trạng thái: Tập trung tốt
              </p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Hệ thống đang ghi nhận bạn rất chú ý bài giảng.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
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

        {/* Dynamic Content */}
        {activeTab === "chat" ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-blue-400 font-medium">
                  Giảng viên
                </span>
                <p className="text-sm bg-slate-800 p-3 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl w-fit text-slate-200 shadow-sm">
                  Chào các bạn, chúng ta bắt đầu bài học nhé!
                </p>
              </div>
            </div>
            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="bg-slate-950 rounded-xl border border-slate-800 flex items-center p-2">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-transparent border-none text-sm px-2 focus:outline-none text-slate-200"
                />
                <button className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ParticipantList
              participants={mockParticipants.map((p) => ({
                id: p.id,
                name: p.name,
                role: p.role,
                isMuted: p.isMuted,
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
