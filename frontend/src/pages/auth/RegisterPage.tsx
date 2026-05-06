import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { ROUTES } from "../../constants";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    teacher_code: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.full_name || !form.email || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (role === "teacher" && !form.teacher_code) {
      setError("Vui lòng nhập mã xác thực giảng viên");
      return;
    }
    // TODO: gọi API register sau
    console.log("Register:", { ...form, role });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
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
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Đăng ký</h1>
          <p className="text-gray-500 text-sm mb-6">Tạo tài khoản mới</p>

          {/* Role toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                role === "student"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sinh viên
            </button>
            <button
              type="button"
              onClick={() => setRole("teacher")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                role === "teacher"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Giảng viên
            </button>
          </div>

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
                Họ và tên
              </label>
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                           focus:outline-none focus:border-blue-500 focus:ring-1
                           focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
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
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Ít nhất 6 ký tự"
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

            {/* Teacher code — chỉ hiện khi chọn giảng viên */}
            {role === "teacher" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã xác thực giảng viên
                </label>
                <input
                  name="teacher_code"
                  type="text"
                  value={form.teacher_code}
                  onChange={handleChange}
                  placeholder="Nhập mã do nhà trường cấp"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm
                             focus:outline-none focus:border-blue-500 focus:ring-1
                             focus:ring-blue-500 transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Liên hệ quản trị viên để lấy mã xác thực
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium
                         hover:bg-blue-700 transition-colors mt-2"
            >
              Đăng ký
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Đã có tài khoản?{" "}
            <Link
              to={ROUTES.LOGIN}
              className="text-blue-600 font-medium hover:underline"
            >
              Đăng nhập
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
