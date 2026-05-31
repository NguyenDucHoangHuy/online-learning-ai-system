import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ROUTES } from "../../constants";
import { authService } from "../../services/auth/auth.service";
import { useAuthStore } from "../../stores/auth.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setIsLoading(true);

      // 1. Gửi request dữ liệu thô sang Backend Express
      const response = await authService.login({ email, password });

      if (response.success) {
        const { user, accessToken, refreshToken } = response.data;

        // 1. Lưu trọn bộ 3 món bảo bối vào Zustand Store
        setAuth(user, accessToken, refreshToken);

        // 2. Định tuyến tường minh bằng biến tập trung
        const redirectPath =
          user.role === "TEACHER"
            ? ROUTES.TEACHER.DASHBOARD
            : ROUTES.STUDENT.JOIN;

        navigate(redirectPath);
      }
    } catch (err: unknown) {
      // Ép kiểu hoặc kiểm tra an toàn nếu err là một thực thể Error chuẩn
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Tên đăng nhập hoặc mật khẩu không chính xác";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Đăng nhập
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Chào mừng bạn trở lại với EduSense.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled={isLoading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                disabled={isLoading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-11 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-blue-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-950/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Chưa có tài khoản?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-bold text-blue-300 hover:text-blue-200"
          >
            Đăng ký ngay
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link
            to={ROUTES.HOME}
            className="font-semibold transition-colors hover:text-white"
          >
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
