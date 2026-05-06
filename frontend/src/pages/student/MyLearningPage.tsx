// src/pages/student/MyLearningPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  MapPin,
  BarChart2,
} from "lucide-react";
import Sidebar from "../../components/layout/SidebarStudent";

// Data mẫu
const learningData = [
  {
    id: 1,
    title: "CALCULUS I: INTEGRALS",
    date: "2/15/2026",
    status: "COURSE COMPLETED",
    room: "MATH-101",
  },
  {
    id: 2,
    title: "MACROECONOMIC PRINCIPLES",
    date: "3/10/2026",
    status: "COURSE COMPLETED",
    room: "ECON-1",
  },
  {
    id: 3,
    title: "ETHICS IN AI FOUNDATIONS",
    date: "4/5/2026",
    status: "COURSE COMPLETED",
    room: "PHI-302",
  },
  {
    id: 4,
    title: "ORGANIC CHEMISTRY LAB",
    date: "4/22/2026",
    status: "COURSE COMPLETED",
    room: "CHEM-4",
  },
];

export default function MyLearningPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar dùng chung */}
      <Sidebar activeItem="History" />

      {/* Nội dung chính */}
      <main className="flex-1 ml-[380px] p-10 md:p-14 lg:p-20 overflow-y-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Session History
          </h1>
          <p className="text-slate-500 font-medium">
            Review your academic journey and previous classroom interactions
          </p>
        </div>

        {/* Danh sách lớp học đã tham gia */}
        <div className="flex flex-col gap-4 max-w-5xl">
          {learningData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              {/* Phần thông tin bên trái */}
              <div className="flex items-center gap-5 md:gap-6">
                {/* Icon Box */}
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
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

                    {/* Trạng thái */}
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md">
                      <CheckCircle2 size={14} />
                      <span className="tracking-wider">{item.status}</span>
                    </div>

                    {/* Phòng học */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4 md:pl-6">
                      <MapPin size={14} className="text-slate-400" />
                      <span className="text-slate-600">ROOM: {item.room}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nút thao tác bên phải */}
              <button
                onClick={() => alert(`Đang mở báo cáo cho môn: ${item.title}`)}
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 flex-shrink-0"
              >
                REVIEW REPORT
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
