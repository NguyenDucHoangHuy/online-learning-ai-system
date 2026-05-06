import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { ROUTES } from "../../constants";

export default function LoginPage() {
  const navigate = useNavigate();
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
    // TODO: gọi API login sau
    console.log("Login:", { email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-none">EduSense</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Platform
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Đăng nhập
          </h1>
          <p className="text-gray-500 text-sm mb-6">Chào mừng bạn trở lại!</p>

          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600
                            text-sm px-4 py-3 rounded-lg mb-4"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:border-blue-500 focus:ring-1
                           focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                             focus:outline-none focus:border-blue-500 focus:ring-1
                             focus:ring-blue-500 transition-colors pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium
                         hover:bg-blue-700 transition-colors mt-2"
            >
              Đăng nhập
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Chưa có tài khoản?{" "}
            <Link
              to={ROUTES.REGISTER}
              className="text-blue-600 font-medium hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          <Link to={ROUTES.HOME} className="hover:text-gray-600">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
