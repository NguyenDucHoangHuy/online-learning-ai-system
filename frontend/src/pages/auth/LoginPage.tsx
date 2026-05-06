import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { ROUTES } from "../../constants";

export default function LoginPage() {
  const navigate = useNavigate(); // Đã được sử dụng bên dưới
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    // Giả lập logic đăng nhập thành công
    console.log("Login:", { email, password });

    // FIX LỖI: Chuyển hướng người dùng về trang chủ hoặc dashboard
    navigate("/teacher/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo - Cập nhật sang Indigo đồng bộ với Dashboard */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-none">EduSense</p>
            <p className="text-[10px] text-blue-500 uppercase font-bold tracking-widest">
              Platform
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Đăng nhập</h1>
          <p className="text-gray-500 text-sm mb-6 font-medium">
            Chào mừng bạn trở lại!
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm px-4 py-3 rounded-xl mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all mt-2 shadow-md shadow-blue-100 active:scale-[0.98]"
            >
              Đăng nhập
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6 font-medium">
            Chưa có tài khoản?{" "}
            <Link
              to={ROUTES.REGISTER}
              className="text-blue-600 font-bold hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link
            to={ROUTES.HOME}
            className="hover:text-blue-600 font-bold transition-colors"
          >
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
