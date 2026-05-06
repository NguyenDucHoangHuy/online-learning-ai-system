import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-6xl font-bold text-gray-200">404</p>
      <p className="text-gray-500">Trang không tồn tại</p>
      <button
        onClick={() => navigate(ROUTES.HOME)}
        className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm hover:bg-blue-700"
      >
        Về trang chủ
      </button>
    </div>
  );
}
