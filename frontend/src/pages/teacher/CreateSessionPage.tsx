// src/pages/teacher/CreateSessionPage.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  ShieldCheck,
  ChevronRight,
  Plus,
  BookOpen,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ROUTES } from "../../constants";
import { useClasses } from "../../services/classes/classes.queries";
import { useCreateSession } from "../../services/sessions/sessions.queries";

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlClassId = searchParams.get("classId") || "";

  // --- 📡 CONNECT API LAYERS ---
  const { data: classesResponse, isLoading: isClassesLoading } = useClasses();
  const { mutate: createSession, isPending: isLaunching } = useCreateSession();

  const classesList = classesResponse?.data || [];

  // --- 🎯 STATES & OPTIMIZATIONS ---
  // FIX 4: Khởi tạo trực tiếp từ URL, triệt tiêu hoàn toàn useEffect thừa
  const [selectedClassId, setSelectedClassId] = useState(urlClassId);
  const [sessionTitle, setSessionTitle] = useState("");
  const [approvalRequired, setApprovalRequired] = useState(false);
  const [error, setError] = useState("");

  // FIX 3: Derived State — Tự động dò tìm thông tin lớp học chuẩn từ State của TanStack Query
  const selectedClass = classesList.find((c) => c.id === selectedClassId);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedClassId) {
      setError("Vui lòng chọn một môn học/lớp học để mở phiên dạy trực tuyến.");
      return;
    }
    if (!sessionTitle.trim()) {
      setError("Vui lòng đặt tên/tiêu đề cho buổi học này.");
      return;
    }

    // 📡 KÍCH NỔ API
    createSession(
      {
        // 🎯 FIX TẠI ĐÂY: Trỏ đúng tên biến State của bồ vào Key khế ước dữ liệu
        classId: selectedClassId,
        payload: {
          title: sessionTitle.trim(),
          requireApproval: approvalRequired,
        },
      },
      {
        onSuccess: (response) => {
          const liveSessionId = response.data.id;
          navigate(ROUTES.TEACHER.SESSION.replace(":sessionId", liveSessionId));
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Tạo phòng học thất bại.",
          );
        },
      },
    );
  };

  return (
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

      {error && (
        <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-600 flex items-center gap-3">
          <ShieldAlert size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* CONTENT FORM */}
      <form
        onSubmit={handleLaunch}
        className="grid grid-cols-1 xl:grid-cols-3 gap-10"
      >
        {/* LEFT FORM */}
        <div className="xl:col-span-2 space-y-8 bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-slate-200">
          {/* Tận dụng FIX 3: Hiển thị hộp tóm tắt môn học cực kỳ chuyên nghiệp nếu đã chọn lớp */}
          {selectedClass && (
            <div className="bg-blue-50/40 border border-blue-100/70 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in duration-300">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-200">
                <BookOpen size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase block">
                  Selected discipline code: {selectedClass.code}
                </span>
                <h4 className="font-extrabold text-slate-900 text-base mt-0.5">
                  {selectedClass.name}
                </h4>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. CHỌN MÔN HỌC */}
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
                  disabled={isClassesLoading || isLaunching}
                  className={`w-full pl-12 pr-10 py-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer font-bold disabled:opacity-50 ${
                    selectedClassId ? "text-blue-700" : "text-slate-400"
                  }`}
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  <option value="" disabled>
                    {isClassesLoading
                      ? "Loading disciplines..."
                      : "-- Select a Class --"}
                  </option>
                  {classesList.map((cls) => (
                    <option
                      key={cls.id}
                      value={cls.id}
                      className="text-slate-700"
                    >
                      [{cls.code}] {cls.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {isClassesLoading ? (
                    <Loader2
                      size={16}
                      className="animate-spin text-slate-400"
                    />
                  ) : (
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
                      />
                    </svg>
                  )}
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
                disabled={isLaunching}
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="bg-slate-50 border-slate-100 rounded-2xl p-7 font-bold text-slate-800 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                Session Code
              </label>
              <Input
                value="AUTO-GENERATED ON LAUNCH"
                readOnly
                className="bg-slate-100/80 border-slate-200 rounded-2xl p-7 font-mono font-bold text-sm text-slate-400 select-none"
              />
            </div>

            <div className="flex items-center bg-blue-50/30 border border-dashed border-blue-200/60 rounded-2xl px-6 py-4 text-xs font-medium text-blue-700 leading-relaxed">
              💡 Hệ thống sẽ tự động mã hóa đường truyền WebRTC và chuẩn bị sẵn
              mô hình AI phân tích cảm xúc ngay khi bồ kích hoạt mở lớp.
            </div>
          </div>

          {/* GOVERNANCE */}
          <div className="space-y-5 pt-4 border-t border-slate-50">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              Governance
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => !isLaunching && setApprovalRequired(false)}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${
                  !approvalRequired
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                } ${isLaunching ? "opacity-50 cursor-not-allowed" : ""}`}
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
                onClick={() => !isLaunching && setApprovalRequired(true)}
                className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center gap-5 ${
                  approvalRequired
                    ? "border-blue-600 bg-blue-50/50"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                } ${isLaunching ? "opacity-50 cursor-not-allowed" : ""}`}
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
            type="submit"
            disabled={isLaunching || !sessionTitle || !selectedClassId}
            className="w-full py-8 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLaunching ? (
              <>
                <Loader2 size={24} className="animate-spin text-blue-400" />{" "}
                Launching Room...
              </>
            ) : (
              <>
                <Plus size={24} /> Launch Live Class
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateSessionPage;
