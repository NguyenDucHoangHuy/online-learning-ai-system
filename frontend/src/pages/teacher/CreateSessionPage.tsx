// src/pages/teacher/CreateSessionPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  ShieldCheck,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import SidebarTeacher from "../../components/layout/SidebarTeacher";
import { ROUTES } from "../../constants"; // Dùng chuẩn ROUTES cho đồng bộ

const CreateSessionPage = () => {
  const navigate = useNavigate();

  // Trạng thái cho form
  const [sessionTitle, setSessionTitle] = useState("");
  const sessionCode = "8NV6KX"; // Mã fix cứng để demo
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(false);

  const handleLaunch = () => {
    if (!sessionTitle) return;

    console.log("Launching session:", {
      sessionTitle,
      sessionCode,
      startTime,
      endTime,
      approvalRequired,
    });

    // Điều hướng thẳng vào phòng học Live Session vừa tạo
    navigate(ROUTES.TEACHER.SESSION.replace(":sessionId", sessionCode));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 1. SIDEBAR CHUẨN */}
      <SidebarTeacher activeItem="Create Session" />

      {/* 2. MAIN CONTENT (Đã căn lề ml-[270px] để né Sidebar) */}
      <main className="ml-[270px] flex-1 p-10 md:p-14 lg:p-20 overflow-y-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <div
            className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors group"
            onClick={() => navigate(ROUTES.TEACHER.DASHBOARD)}
          >
            <LayoutDashboard
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Dashboard</span>
          </div>
          <ChevronRight size={14} />
          <span className="text-slate-800 font-medium text-[11px] uppercase tracking-wider">
            Go Live
          </span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Go Live
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl font-medium">
            Initialize an AI-monitored classroom session for your students.
          </p>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Cột trái: Form nhập liệu */}
          <div className="xl:col-span-2 space-y-8 bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Subject Portfolio
                </label>
                <select className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer font-medium">
                  <option>Data Structures & Algorithms</option>
                  <option>Web Development</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Session Title
                </label>
                <Input
                  placeholder="e.g. Midterm Exam Review"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="bg-slate-50 border-slate-100 rounded-2xl p-7 text-slate-800 focus-visible:ring-blue-500/20 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Session Code
                </label>
                <Input
                  value={sessionCode}
                  readOnly
                  className="bg-blue-50/50 border-blue-100 rounded-2xl p-7 font-mono font-bold text-xl text-blue-600 cursor-default"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Start
                  </label>
                  <input
                    type="time"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    End
                  </label>
                  <input
                    type="time"
                    className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-5 pt-4 border-t border-slate-50">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Governance
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Direct Sync Option */}
                <div
                  className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${
                    !approvalRequired
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                  }`}
                  onClick={() => setApprovalRequired(false)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`p-4 rounded-2xl transition-colors ${
                        !approvalRequired
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "bg-white text-slate-400 shadow-sm"
                      }`}
                    >
                      <Zap size={24} />
                    </div>
                  </div>
                  <h4
                    className={`font-bold text-xl ${!approvalRequired ? "text-blue-900" : "text-slate-700"}`}
                  >
                    DIRECT SYNC
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Students join automatically
                  </p>
                </div>

                {/* Gatekeeper Option */}
                <div
                  className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${
                    approvalRequired
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                  }`}
                  onClick={() => setApprovalRequired(true)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`p-4 rounded-2xl transition-colors ${
                        approvalRequired
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "bg-white text-slate-400 shadow-sm"
                      }`}
                    >
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                  <h4
                    className={`font-bold text-xl ${approvalRequired ? "text-blue-900" : "text-slate-700"}`}
                  >
                    GATEKEEPER
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Require teacher approval
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Khối AI & Nút Launch */}
          <div className="space-y-6 flex flex-col">
            <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-xl flex-1 flex flex-col justify-center">
              {/* Background Decoration */}
              <div className="absolute -right-10 -top-10 text-slate-800 opacity-50">
                <Zap size={150} />
              </div>

              <div className="relative z-10">
                <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-blue-500/30">
                  <Zap size={32} className="text-blue-400 fill-blue-400" />
                </div>
                <h3 className="text-3xl font-bold mb-4 tracking-tight uppercase">
                  AI Integration
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  The EduSense AI engine is ready. It will monitor focus levels,
                  emotional states, and overall engagement in real-time once the
                  session begins.
                </p>
              </div>
            </div>

            <Button
              className="w-full py-8 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              onClick={handleLaunch}
              disabled={!sessionTitle}
            >
              <Plus size={24} /> Launch Live Class
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateSessionPage;
