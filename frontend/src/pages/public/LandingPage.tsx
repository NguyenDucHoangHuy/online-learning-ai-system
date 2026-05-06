import { useNavigate } from "react-router-dom";
import { BookOpen, BarChart2, Brain, ArrowRight, Users } from "lucide-react";
import { ROUTES } from "../../constants";

const features = [
  {
    icon: <Brain size={20} />,
    title: "AI phân tích cảm xúc",
    desc: "Nhận diện trạng thái tập trung qua camera theo thời gian thực",
  },
  {
    icon: <Users size={20} />,
    title: "Lớp học trực tuyến",
    desc: "Tạo phòng học và chia sẻ code cho sinh viên trong vài giây",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Báo cáo chi tiết",
    desc: "Thống kê mức độ tập trung qua từng buổi học",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header
        className="bg-white border-b border-gray-200 px-6 py-4
                         flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">
              EduSense
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Platform
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2
                       rounded-lg hover:bg-gray-100 transition-colors"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="text-sm bg-blue-600 text-white px-4 py-2
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng ký
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-14">
        {/* Hero */}
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Học trực tuyến thông minh hơn với{" "}
            <span className="text-blue-600">AI</span>
          </h1>
          <p className="text-gray-500 text-lg mb-8">
            Hệ thống tự động theo dõi và phân tích mức độ tập trung của sinh
            viên trong lớp học online.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="flex items-center gap-2 bg-blue-600 text-white
                         px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Bắt đầu miễn phí <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="flex items-center gap-2 border border-gray-300 text-gray-700
                         px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Đăng nhập
            </button>
          </div>
        </div>

        {/* 2 role cards — layout giống hình mẫu */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div
              className="w-12 h-12 bg-blue-100 rounded-xl flex items-center
                            justify-center mb-5"
            >
              <BookOpen size={22} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Dành cho sinh viên
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Nhập session code từ giảng viên để tham gia lớp học trực tuyến
              ngay lập tức.
            </p>
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium
                         hover:bg-gray-700 transition-colors flex items-center
                         justify-center gap-2"
            >
              Đăng ký là sinh viên <ArrowRight size={16} />
            </button>
          </div>

          <div className="bg-blue-600 rounded-2xl p-8 text-white">
            <div
              className="w-12 h-12 bg-blue-500 rounded-xl flex items-center
                            justify-center mb-5"
            >
              <BarChart2 size={22} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Dành cho giảng viên</h2>
            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
              Tạo lớp học, mở phòng và theo dõi mức độ tập trung của sinh viên
              qua dashboard thời gian thực.
            </p>
            <button
              onClick={() => navigate(ROUTES.REGISTER)}
              className="w-full bg-white text-blue-600 py-3 rounded-xl font-medium
                         hover:bg-blue-50 transition-colors flex items-center
                         justify-center gap-2"
            >
              Đăng ký là giảng viên <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div
                className="w-10 h-10 bg-blue-50 rounded-lg flex items-center
                              justify-center mb-3 text-blue-600"
              >
                {f.icon}
              </div>
              <p className="font-medium text-gray-900 text-sm mb-1">
                {f.title}
              </p>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer
        className="text-center py-6 text-xs text-gray-400
                         border-t border-gray-200"
      >
        © 2026 EduSense Platform — Đồ án chuyên ngành
      </footer>
    </div>
  );
}
