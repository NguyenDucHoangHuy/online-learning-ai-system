// src/pages/teacher/DashboardPage.tsx
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  PlusCircle,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronRight,
} from "lucide-react";

import { ROUTES } from "../../constants";

const DashboardPage = () => {
  const navigate = useNavigate();

  // Dữ liệu thống kê mẫu
  const stats = [
    {
      label: "TOTAL CLASSES",
      value: "12",
      change: "+12%",
      trend: "up",
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    },
    {
      label: "TOTAL SESSIONS",
      value: "48",
      change: "+5%",
      trend: "up",
      icon: <Activity className="w-5 h-5 text-emerald-600" />,
    },
    {
      label: "AVG. ATTENTION",
      value: "86%",
      change: "+8%",
      trend: "up",
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "QUESTIONS ASKED",
      value: "142",
      change: "-2%",
      trend: "down",
      icon: <TrendingDown className="w-5 h-5 text-orange-600" />,
    },
  ];

  // Danh sách các buổi học gần đây
  const recentSessions = [
    { title: "NEURAL NETWORKS", date: "MAY 6", time: "10:30 AM" },
    { title: "ETHICS IN BIO-ENG", date: "MAY 6", time: "01:15 PM" },
    { title: "ADVANCED REACT", date: "MAY 5", time: "09:00 AM" },
  ];

  return (
    // Sử dụng max-w-7xl mx-auto để nội dung luôn căn giữa và không bị bè ngang trên màn hình to
    <div className="max-w-7xl mx-auto">
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Teacher <span className="text-blue-600">Dashboard</span>
          </h2>
          <p className="text-slate-500 mt-1 text-lg font-medium">
            Welcome back, Professor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm text-sm font-bold text-slate-600">
            <Clock size={16} className="text-blue-600" /> May 6, 2026
          </div>

          <div className="flex gap-2">
            <button className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-all shadow-sm">
              <Search size={18} />
            </button>
            <button className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-all shadow-sm relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 group hover:shadow-md hover:border-blue-100 transition-all hover:-translate-y-1 cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                {stat.icon}
              </div>
              <div
                className={`flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                  stat.trend === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : (
                  <TrendingDown size={12} className="mr-1" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">
              {stat.label}
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* SECTION BIỂU ĐỒ & RECENT SESSIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Biểu đồ */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[400px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                Engagement Overview
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Average Attention Span
              </p>
            </div>

            <button
              onClick={() => navigate(ROUTES.TEACHER.CREATE_SESSION)}
              className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
            >
              <PlusCircle size={14} /> NEW SESSION
            </button>
          </div>

          {/* Khung Biểu đồ SVG mô phỏng */}
          <div className="flex-1 w-full bg-blue-50/50 rounded-[2rem] border-2 border-dashed border-blue-200 flex items-center justify-center relative overflow-hidden mt-4">
            <div className="absolute inset-0 flex items-end">
              <svg
                viewBox="0 0 400 100"
                preserveAspectRatio="none"
                className="w-full h-full text-blue-500 opacity-20"
              >
                <path
                  d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            </div>
            <p className="text-blue-500 font-extrabold text-sm uppercase tracking-widest z-10 bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">
              Attention Waveform Active
            </p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col xl:col-span-1">
          <h3 className="text-xl font-bold mb-6 tracking-tight">
            Recent Sessions
          </h3>

          <div className="space-y-4 flex-1">
            {recentSessions.map((session, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-slate-900 hover:bg-blue-600/20 rounded-2xl transition-all cursor-pointer group border border-slate-800"
                onClick={() => navigate(ROUTES.TEACHER.HISTORY)}
              >
                <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-600 transition-colors shadow-sm">
                  <Clock
                    size={20}
                    className="text-blue-400 group-hover:text-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate uppercase tracking-wide text-slate-100">
                    {session.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest uppercase">
                    {session.date} • {session.time}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(ROUTES.TEACHER.HISTORY)}
            className="w-full mt-8 py-4 border border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all"
          >
            View All History
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
