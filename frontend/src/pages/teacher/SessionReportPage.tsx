// src/pages/teacher/SessionReportPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Smile,
  Zap,
  Users,
  ChevronRight,
} from "lucide-react";
import SidebarTeacher from "../../components/layout/SidebarTeacher";

const participationData = [
  {
    id: 1,
    fullName: "Quốc Anh",
    duration: "60/60m",
    attention: 94,
    primaryState: "SATISFIED",
  },
  {
    id: 2,
    fullName: "Công Đức",
    duration: "55/60m",
    attention: 72,
    primaryState: "NEUTRAL",
  },
  {
    id: 3,
    fullName: "Nguyễn Văn A",
    duration: "60/60m",
    attention: 45,
    primaryState: "DISTRACTED",
  },
  {
    id: 4,
    fullName: "Hoàng Huy",
    duration: "42/60m",
    attention: 89,
    primaryState: "ENGAGED",
  },
];

export default function SessionReportPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar Component */}
      <SidebarTeacher activeItem="History" />

      {/* Nội dung chính */}
      <main className="flex-1 ml-[270px] p-8 md:p-12 lg:p-16 overflow-y-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Session Report
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Post-class analysis and emotional engagement metrics
              </p>
            </div>
          </div>

          <button
            onClick={() => alert("Exporting Data...")}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors shadow-md shadow-slate-900/10"
          >
            <Download size={16} />
            EXPORT DETAILED DATA
          </button>
        </div>

        {/* Top Dashboard Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-10">
          {/* Biểu đồ (Chiếm 2 cột) */}
          <div className="xl:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[360px]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  Engagement Timeline
                </h3>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                  Average Participant Attention
                </span>
              </div>
              <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest">
                AI TRACKING HISTORY
              </span>
            </div>

            {/* Chart Body (Tái sử dụng SVG cũ nhưng bọc bằng Tailwind) */}
            <div className="relative h-48 w-full mt-4 flex flex-col justify-end">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] font-bold text-slate-400 pb-6">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div className="ml-8 relative h-full">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 520 160"
                  preserveAspectRatio="none"
                  className="absolute bottom-6"
                >
                  <path
                    d="M 0 110 C 60 80, 100 50, 160 50 C 220 50, 250 110, 300 90 C 350 70, 400 40, 520 70"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="0"
                    cy="110"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="100"
                    cy="75"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="160"
                    cy="50"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="250"
                    cy="95"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="330"
                    cy="65"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="400"
                    cy="50"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle
                    cx="520"
                    cy="75"
                    r="5"
                    fill="#ffffff"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                </svg>

                <div className="absolute bottom-0 w-full flex justify-between text-[10px] font-bold text-slate-400">
                  <span>0m</span>
                  <span>10m</span>
                  <span>20m</span>
                  <span>30m</span>
                  <span>40m</span>
                  <span>50m</span>
                  <span>60m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Metrics - Chiếm 1 cột) */}
          <div className="xl:col-span-1 flex flex-col gap-6">
            {/* Happiness Index */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <Smile size={28} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-1">88.5%</h2>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-5 uppercase">
                Happiness Index
              </p>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[88.5%] rounded-full"></div>
              </div>
            </div>

            {/* AI Observation */}
            <div className="bg-slate-950 text-white rounded-3xl p-8 shadow-xl flex-1 flex flex-col justify-center relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute -right-6 -top-6 text-slate-800 opacity-50">
                <Zap size={100} />
              </div>

              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-400">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    AI OBSERVATION
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">
                    Smart Analytics
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-300 font-medium italic relative z-10">
                "Participation peaked exactly 20 minutes in during the live
                demo. This suggests visual demonstrations significantly increase
                student retention for this topic."
              </p>
            </div>
          </div>
        </div>

        {/* Student Participation Breakdown Section */}
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Student Participation Breakdown
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-1/4">
                    Full Name
                  </th>
                  <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-[15%]">
                    Duration
                  </th>
                  <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-1/4">
                    Attention
                  </th>
                  <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase w-1/5">
                    Primary State
                  </th>
                  <th className="px-8 py-5 text-[10px] font-extrabold text-slate-400 tracking-widest uppercase text-right">
                    Insight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participationData.map((item) => {
                  // Cấu hình style badge động dựa vào Primary State
                  let badgeStyle = "bg-slate-100 text-slate-600";
                  if (item.primaryState === "SATISFIED")
                    badgeStyle = "bg-emerald-50 text-emerald-600";
                  if (item.primaryState === "DISTRACTED")
                    badgeStyle = "bg-rose-50 text-rose-600";
                  if (item.primaryState === "ENGAGED")
                    badgeStyle = "bg-blue-50 text-blue-600";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5 text-sm font-bold text-slate-900">
                        {item.fullName}
                      </td>
                      <td className="px-8 py-5 text-sm font-semibold text-slate-600">
                        {item.duration}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-900 w-8">
                            {item.attention}%
                          </span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.attention > 80 ? "bg-emerald-400" : item.attention > 50 ? "bg-blue-400" : "bg-rose-400"}`}
                              style={{ width: `${item.attention}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest ${badgeStyle}`}
                        >
                          {item.primaryState}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => alert(`Inspecting ${item.fullName}`)}
                          className="text-[10px] font-extrabold text-blue-600 tracking-widest flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          INSPECT <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
