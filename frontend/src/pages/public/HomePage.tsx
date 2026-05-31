import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  BarChart2,
  Brain,
  ArrowRight,
  Users,
  ShieldCheck,
} from "lucide-react";
import { ROUTES } from "../../constants";
import { useAuthStore } from "../../stores/auth.store";

const features = [
  {
    icon: <Brain size={20} />,
    title: "AI phân tích cảm xúc",
    desc: "Nhận diện trạng thái tập trung và biểu cảm qua camera theo thời gian thực.",
  },
  {
    icon: <Users size={20} />,
    title: "Lớp học trực tuyến",
    desc: "Tạo phòng học, chia sẻ luồng stream và tương tác thời gian thực siêu tốc.",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Báo cáo chi tiết",
    desc: "Thống kê biểu đồ trực quan về mức độ chú ý qua từng mốc thời gian buổi học.",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  // 🎯 Sử dụng Selector riêng biệt giúp Component chỉ re-render khi chính xác trường đó thay đổi
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);

  // Tự sinh trạng thái xác thực dựa trên sự tồn tại của Token giống hệt bên ProtectedRoute
  const isAuthenticated = Boolean(accessToken);

  // ⚡ AUTOMATIC REDIRECT: Chặn đứng việc hiển thị Landing Page nếu user đã có phiên đăng nhập hợp lệ
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "TEACHER") {
        navigate(ROUTES.TEACHER.DASHBOARD);
      } else {
        navigate(ROUTES.STUDENT.JOIN);
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col">
      {/* Hiệu ứng Ambient Glow dưới nền đồng bộ với AuthLayout */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_35%)]" />
      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/30">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">
              EduSense
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
              AI Learning Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-white/5 transition-all"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="text-sm font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 shadow-lg shadow-blue-950/40 transition-all active:scale-[0.98]"
          >
            Đăng ký
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-6 py-16 gap-16 max-w-6xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mt-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-6">
            <ShieldCheck size={14} /> Powered by Advanced Computer Vision
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Học trực tuyến thông minh hơn với{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-sky-400">
              AI
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed">
            Hệ thống tự động đồng bộ luồng video WebRTC, phân tích trạng thái
            biểu cảm và đo lường mức độ tập trung của người học theo thời gian
            thực.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-500 shadow-xl shadow-blue-950/50 transition-all hover:translate-y-[-1px] active:scale-[0.98]"
            >
              Bắt đầu miễn phí <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="flex items-center gap-2 border border-white/10 bg-white/5 text-slate-200 px-6 py-3.5 rounded-xl font-bold hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98]"
            >
              Khám phá không gian lớp học
            </button>
          </div>
        </div>

        {/* Roles Segment Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Area */}
          <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur flex flex-col justify-between hover:border-white/20 transition-all group">
            <div>
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
                <BookOpen size={22} />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-3">
                Dành cho sinh viên
              </h2>
              <p className="text-slate-400 text-sm mb-8 leading-6">
                Chỉ cần nhập mã Session Code được cấp từ giảng viên để tham gia
                lớp học trực tuyến, kích hoạt camera phân tích và kết nối chat
                ngay lập tức.
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-700 border border-white/5 transition-all flex items-center justify-center gap-2 group-hover:border-blue-500/30"
            >
              Tham gia làm Sinh viên{" "}
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-blue-400 transition-colors"
              />
            </button>
          </div>

          {/* Teacher Area */}
          <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-2xl flex flex-col justify-between hover:shadow-blue-900/20 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 text-white shadow-inner">
                <BarChart2 size={22} />
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-3">
                Dành cho giảng viên
              </h2>
              <p className="text-blue-100 text-sm mb-8 leading-6">
                Quản lý danh sách lớp, mở các phiên học realtime, điều phối kết
                nối WebRTC đa điểm và quan sát chỉ số tập trung của lớp học qua
                Dashboard AI thống kê.
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="w-full bg-white text-blue-700 py-3.5 rounded-xl font-bold hover:bg-blue-50 shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Khai phóng phòng dạy <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Features Minimalist Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:bg-slate-900/70 transition-all"
            >
              <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                {f.icon}
              </div>
              <p className="font-bold text-white text-base mb-2">{f.title}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-slate-500 border-t border-white/5 bg-slate-950/80">
        © 2026 EduSense Platform — Hệ thống phân tích lớp học trực tuyến thông
        minh
      </footer>
    </div>
  );
}
