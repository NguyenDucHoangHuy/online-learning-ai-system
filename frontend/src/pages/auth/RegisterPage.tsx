import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { ROUTES } from "../../constants";
import { authService } from "../../services/auth/auth.service";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT"); // Đồng bộ chữ HOA theo Enum của Backend
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🎯 ĐỒNG BỘ: Chuyển đổi toàn bộ Key của Form sang chuẩn camelCase
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    teacherCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Cập nhật biến check theo cấu trúc camelCase mới
    if (!form.fullName || !form.email || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (role === "TEACHER" && !form.teacherCode) {
      setError("Vui lòng nhập mã xác thực giảng viên");
      return;
    }

    try {
      setIsLoading(true);

      // 🎯 SIÊU GỌN: Bung lụa trực tiếp payload nhờ cấu trúc form đã khớp khít với API contract
      const response = await authService.register({
        ...form,
        role,
      });

      if (response.success) {
        console.log("🎉 Khởi tạo tài khoản thành công:", response.data.user);
        navigate(ROUTES.LOGIN);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Đăng ký không thành công. Email có thể đã tồn tại.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Đăng ký
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Tạo tài khoản mới cho sinh viên hoặc giảng viên.
        </p>

        <div className="mt-6 flex rounded-2xl border border-white/10 bg-slate-950/60 p-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setRole("STUDENT")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              role === "STUDENT"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sinh viên
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => setRole("TEACHER")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              role === "TEACHER"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Giảng viên
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Họ và tên
            </label>
            <input
              name="fullName" // 🎯 SỬA: Đổi từ full_name sang fullName
              type="text"
              disabled={isLoading}
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
              Email
            </label>
            <input
              name="email"
              type="email"
              disabled={isLoading}
              value={form.email}
              onChange={handleChange}
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
                name="password"
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
                value={form.password}
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 pr-11 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-blue-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {role === "TEACHER" && (
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                Mã xác thực giảng viên
              </label>
              <input
                name="teacherCode" // 🎯 SỬA: Đổi từ teacher_code sang teacherCode
                type="text"
                disabled={isLoading}
                value={form.teacherCode}
                onChange={handleChange}
                placeholder="Nhập mã do nhà trường cấp"
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-slate-400">
                Liên hệ quản trị viên để lấy mã xác thực giảng viên.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-950/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
          >
            Đăng ký
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          Đã có tài khoản?{" "}
          <Link
            to={ROUTES.LOGIN}
            className="font-bold text-blue-300 hover:text-blue-200"
          >
            Đăng nhập
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
