import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  History,
  Search,
  Bell,
  LogOut,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronRight,
  Monitor,
} from "lucide-react";

import { Button } from "../../components/ui/Button";

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
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
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
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-800 font-sans">
      {/* SIDEBAR - Thanh điều hướng bên trái */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full z-20">
        <div
          className="flex items-center gap-3 mb-10 px-2 cursor-pointer transition-transform active:scale-95"
          onClick={() => navigate("/teacher/dashboard")}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-100">
            AI
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-slate-900">
              EduSense
            </h1>
            <span className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">
              Platform
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-3 w-full p-3 bg-indigo-50 text-indigo-600 rounded-xl font-semibold transition-all"
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button
            onClick={() => navigate("/teacher/classes")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all font-medium"
          >
            <BookOpen size={20} /> Manage Classes
          </button>

          {/* SỰ KIỆN CLICK ĐIỀU HƯỚNG ĐẾN CREATE SESSION */}
          <button
            onClick={() => navigate("/teacher/create-session")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all font-medium group"
          >
            <PlusCircle
              size={20}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            Create Session
          </button>

          <button
            onClick={() => navigate("/teacher/history")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all font-medium"
          >
            <History size={20} /> History
          </button>
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-3 w-full p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold group">
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT - Nội dung chính */}
      <main className="ml-64 flex-1 p-10">
        <header className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Teacher <span className="text-indigo-600">Dashboard</span>
            </h2>
            <p className="text-slate-500 mt-1 text-lg font-medium">
              Welcome back, Professor
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/teacher/realtime-monitor")}
              className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 flex items-center gap-2 rounded-full px-6 py-2.5 font-bold text-[11px] tracking-wide shadow-sm active:scale-95 transition-all"
            >
              <Monitor size={16} /> PREVIEW LIVE MONITOR
            </Button>

            <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm text-sm font-bold text-slate-600">
              <Clock size={16} className="text-indigo-500" /> May 6, 2026
            </div>

            <div className="flex gap-2">
              <button className="p-2.5 bg-white border border-gray-100 rounded-full text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                <Search size={18} />
              </button>
              <button className="p-2.5 bg-white border border-gray-100 rounded-full text-slate-400 hover:text-indigo-600 transition-all shadow-sm relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        {/* STATS GRID - Các ô thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 group hover:shadow-md transition-all hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                  {stat.icon}
                </div>
                <div
                  className={`flex items-center text-[11px] font-bold px-2 py-1 rounded-lg ${stat.trend === "up" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
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

        {/* SECTION BIỂU ĐỒ VÀ CÁC BUỔI HỌC GẦN ĐÂY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Biểu đồ tương tác */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                  Engagement Overview
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Average Attention Span
                </p>
              </div>

              {/* NÚT TẠO MỚI NHANH TRONG DASHBOARD */}
              <button
                onClick={() => navigate("/teacher/create-session")}
                className="bg-[#1E293B] text-white rounded-xl px-4 py-2 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                <PlusCircle size={14} /> NEW SESSION
              </button>
            </div>

            <div className="h-64 w-full bg-indigo-50/20 rounded-[2rem] border-2 border-dashed border-indigo-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-end">
                <svg
                  viewBox="0 0 400 100"
                  className="w-full h-full text-indigo-500 opacity-20"
                >
                  <path
                    d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </div>
              <p className="text-indigo-300 font-bold text-sm uppercase tracking-widest z-10">
                Attention Waveform Active
              </p>
            </div>
          </div>

          {/* Cột phải: Recent Sessions */}
          <div className="bg-[#0F172A] p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col">
            <h3 className="text-xl font-bold mb-6 tracking-tight">
              Recent Sessions
            </h3>
            <div className="space-y-4 flex-1">
              {recentSessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-blue-600/20 rounded-2xl transition-all cursor-pointer group border border-slate-700/50"
                  onClick={() => navigate("/teacher/history")} // Hoặc link đến chi tiết session
                >
                  <div className="p-3 bg-slate-700 rounded-xl group-hover:bg-blue-600 transition-colors">
                    <Clock
                      size={20}
                      className="text-indigo-300 group-hover:text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold truncate uppercase tracking-wide">
                      {session.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest uppercase">
                      {session.date} • {session.time}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-500 group-hover:text-white transition-colors"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/teacher/history")}
              className="w-full mt-8 py-4 border border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all"
            >
              View All History
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
