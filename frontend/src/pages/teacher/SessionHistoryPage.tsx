// src/pages/teacher/SessionHistoryPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, Calendar, Clock, Hash, Eye, Play } from "lucide-react";
import SidebarTeacher from "../../components/layout/SidebarTeacher";

const sessionData = [
  {
    id: 1,
    title: "NEURAL NETWORKS ARCHITECTURE",
    date: "4/20/2026",
    status: "ARCHIVED",
    idCode: "AI-902",
    isActive: false,
  },
  {
    id: 2,
    title: "MACROECONOMIC PRINCIPLES",
    date: "4/25/2026",
    status: "ARCHIVED",
    idCode: "ECON-1",
    isActive: false,
  },
  {
    id: 3,
    title: "QUANTUM COMPUTING INTRO",
    date: "4/28/2026",
    status: "ARCHIVED",
    idCode: "PHY-8",
    isActive: false,
  },
  {
    id: 4,
    title: "ADVANCED UX PATTERNS",
    date: "5/6/2026",
    status: "ACTIVE CHANNEL",
    idCode: "CS-505",
    isActive: true,
  },
];

export default function SessionHistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar Giáo viên */}
      <SidebarTeacher activeItem="History" />

      {/* Nội dung chính (Có margin-left để không bị đè bởi Sidebar) */}
      <main className="flex-1 ml-[270px] p-10 md:p-14 lg:p-20 overflow-y-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Session History
          </h1>
          <p className="text-slate-500 font-medium">
            Review past classrooms and comprehensive emotional analysis reports
          </p>
        </div>

        {/* Danh sách Session */}
        <div className="flex flex-col gap-4 max-w-5xl">
          {sessionData.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group ${
                item.isActive
                  ? "border-blue-200 shadow-blue-900/5"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* Phần thông tin bên trái */}
              <div className="flex items-center gap-5 md:gap-6">
                {/* Icon Box */}
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    item.isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                  }`}
                >
                  <BarChart2 size={24} />
                </div>

                {/* Chi tiết */}
                <div>
                  <h3 className="text-[15px] md:text-base font-bold text-slate-900 mb-3 tracking-wide">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs font-semibold text-slate-500">
                    {/* Ngày tháng */}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-slate-600">{item.date}</span>
                    </div>

                    {/* Trạng thái (Phân biệt Active / Archived) */}
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                        item.isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Clock size={14} />
                      <span className="tracking-wider">{item.status}</span>
                    </div>

                    {/* Mã phòng (ID Code) */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4 md:pl-6">
                      <Hash size={14} className="text-slate-400" />
                      <span className="text-slate-600">ID: {item.idCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút thao tác bên phải */}
              <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                {/* Nút hiển thị riêng cho lớp đang Active */}
                {item.isActive && (
                  <button
                    onClick={() => navigate(`/teacher/session/${item.idCode}`)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-md shadow-blue-600/20"
                  >
                    <Play size={16} />
                    RESUME PULSE
                  </button>
                )}

                {/* Nút mặc định cho tất cả các lớp */}
                <button
                  onClick={() => navigate("/teacher/session-report")}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-sm"
                >
                  <Eye size={16} />
                  INSPECT REPORT
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
