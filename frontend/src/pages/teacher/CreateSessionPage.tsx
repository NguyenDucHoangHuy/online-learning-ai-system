// src/pages/teacher/CreateSessionPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  ShieldCheck,
  ChevronRight,
  Plus,
  BookOpen, // Thêm icon
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants";

// Data mẫu: Danh sách các môn học của Giảng viên
const mockClasses = [
  { id: "nn-401", title: "NEURAL NETWORKS 401" },
  { id: "ds-102", title: "DIGITAL SOCIOLOGY" },
  { id: "qc-300", title: "QUANTUM CRYPTOGRAPHY" },
];

const CreateSessionPage = () => {
  const navigate = useNavigate();

  // --- States ---
  const [selectedClassId, setSelectedClassId] = useState(""); // State lưu Class ID
  const [sessionTitle, setSessionTitle] = useState("");
  const sessionCode = "8NV6KX";
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(false);

  const handleLaunch = () => {
    if (!sessionTitle || !selectedClassId) return; // Rào validate thêm selectedClassId

    console.log("Launching session:", {
      classId: selectedClassId,
      sessionTitle,
      sessionCode,
      startTime,
      endTime,
      approvalRequired,
    });
    navigate(ROUTES.TEACHER.SESSION.replace(":sessionId", sessionCode));
  };

  return (
    // LƯU Ý: Không bọc Sidebar hay ml-xxx ở đây nữa vì đã có TeacherLayout lo
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
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

      {/* CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* LEFT FORM */}
        <div className="xl:col-span-2 space-y-8 bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. CHỌN MÔN HỌC (Đã xử lý logic) */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Select Discipline
              </label>
              <div className="relative">
                <BookOpen
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <select
                  className={`w-full pl-12 pr-5 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer font-bold ${selectedClassId ? "text-blue-700" : "text-slate-400"}`}
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="" disabled>
                    -- Select a Class --
                  </option>
                  {mockClasses.map((cls) => (
                    <option
                      key={cls.id}
                      value={cls.id}
                      className="text-slate-700"
                    >
                      {cls.title}
                    </option>
                  ))}
                </select>
                {/* Custom mũi tên thả xuống */}
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. NHẬP TIÊU ĐỀ */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Session Title
              </label>
              <Input
                placeholder="e.g. Midterm Exam Review"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="bg-slate-50 border-slate-100 rounded-2xl p-7 font-bold text-slate-800"
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
                className="bg-blue-50 border-blue-100 rounded-2xl p-7 font-mono font-bold text-xl text-blue-600"
              />
            </div>

            {/* TIME */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Start
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  End
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* GOVERNANCE */}
          <div className="space-y-5 pt-4 border-t border-slate-50">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Governance
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => setApprovalRequired(false)}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${
                  !approvalRequired
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl transition-colors ${!approvalRequired ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-white text-slate-400 shadow-sm"}`}
                >
                  <Zap size={24} />
                </div>
                <div>
                  <h4
                    className={`font-bold text-lg ${!approvalRequired ? "text-blue-900" : "text-slate-700"}`}
                  >
                    DIRECT SYNC
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Students join automatically
                  </p>
                </div>
              </div>

              <div
                onClick={() => setApprovalRequired(true)}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${
                  approvalRequired
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl transition-colors ${approvalRequired ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "bg-white text-slate-400 shadow-sm"}`}
                >
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4
                    className={`font-bold text-lg ${approvalRequired ? "text-blue-900" : "text-slate-700"}`}
                  >
                    GATEKEEPER
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Require approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="space-y-6 flex flex-col">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-xl flex-1 flex flex-col justify-center">
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
            onClick={handleLaunch}
            disabled={!sessionTitle || !selectedClassId}
            className="w-full py-8 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <Plus size={24} /> Launch Live Class
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateSessionPage;
