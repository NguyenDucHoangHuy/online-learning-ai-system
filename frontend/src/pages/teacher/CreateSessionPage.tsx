import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  History,
  LogOut,
  Zap,
  ShieldCheck,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const CreateSessionPage = () => {
  const navigate = useNavigate();

  // Trạng thái cho form
  const [sessionTitle, setSessionTitle] = useState("");
  const sessionCode = "8NV6KX";
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
    alert("Session Created!");
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-800 font-sans">
      {/* --- GIỮ NGUYÊN SIDEBAR TỪ DASHBOARD --- */}
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
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-gray-50 rounded-xl transition-all font-medium"
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button
            onClick={() => navigate("/teacher/manage-classes")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-gray-50 rounded-xl transition-all font-medium"
          >
            <BookOpen size={20} /> Manage Classes
          </button>

          <button
            onClick={() => navigate("/teacher/create-session")}
            className="flex items-center gap-3 w-full p-3 bg-indigo-50 text-indigo-600 rounded-xl font-semibold transition-all"
          >
            <PlusCircle size={20} /> Create Session
          </button>

          <button
            onClick={() => navigate("/teacher/history")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-gray-50 rounded-xl transition-all font-medium"
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

      {/* --- NỘI DUNG CHÍNH (CREATE SESSION) --- */}
      <main className="ml-64 flex-1 p-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <div
            className="flex items-center gap-1 hover:text-indigo-600 cursor-pointer transition-colors group"
            onClick={() => navigate("/teacher/dashboard")}
          >
            <LayoutDashboard
              size={16}
              className="group-hover:scale-110 transition-transform"
            />
            <span>Dashboard</span>
          </div>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium text-[11px] uppercase tracking-wider">
            Go Live
          </span>
        </nav>

        <div className="mb-12">
          <h1 className="text-5xl font-extrabold text-[#1E293B] mb-3 tracking-tight">
            Go Live
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl font-medium">
            Initialize an AI-monitored classroom session for your students.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Subject Portfolio
                </label>
                <select className="w-full p-5 bg-gray-50 border-none rounded-2xl text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer">
                  <option>Data Structures & Algorithms</option>
                  <option>Web Development</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Session Title
                </label>
                <Input
                  placeholder="e.g. Midterm Exam Review"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl p-7 text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Session Code
                </label>
                <Input
                  value={sessionCode}
                  readOnly
                  className="bg-indigo-50/50 border-none rounded-2xl p-7 font-mono font-bold text-xl text-indigo-600 cursor-default"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    Start
                  </label>
                  <input
                    type="time"
                    className="w-full p-5 bg-gray-50 border-none rounded-2xl outline-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                    End
                  </label>
                  <input
                    type="time"
                    className="w-full p-5 bg-gray-50 border-none rounded-2xl outline-none"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Governance */}
            <div className="space-y-5 pt-4">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">
                Governance
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${!approvalRequired ? "border-indigo-600 bg-indigo-50/30" : "border-gray-50 bg-gray-50/30"}`}
                  onClick={() => setApprovalRequired(false)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`p-4 rounded-2xl ${!approvalRequired ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
                    >
                      <Zap size={24} />
                    </div>
                  </div>
                  <h4 className="font-bold text-xl text-gray-800">
                    DIRECT SYNC
                  </h4>
                </div>
                <div
                  className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all ${approvalRequired ? "border-indigo-600 bg-indigo-50/30" : "border-gray-50 bg-gray-50/30"}`}
                  onClick={() => setApprovalRequired(true)}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`p-4 rounded-2xl ${approvalRequired ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}
                    >
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                  <h4 className="font-bold text-xl text-gray-800">
                    GATEKEEPER
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-[#1E293B] p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-200/50">
              <div className="relative z-10">
                <div className="bg-indigo-500/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-10 border border-indigo-500/30">
                  <Zap size={28} className="text-indigo-400 fill-indigo-400" />
                </div>
                <h3 className="text-3xl font-bold mb-6 tracking-tight uppercase">
                  AI Integration
                </h3>
                <p className="text-slate-400 text-base leading-relaxed mb-8">
                  AI will monitor focus levels and engagement in real-time.
                </p>
              </div>
            </div>

            <Button
              className="w-full py-8 bg-[#1E293B] hover:bg-slate-800 text-white rounded-[2rem] text-xl font-bold flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50"
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
