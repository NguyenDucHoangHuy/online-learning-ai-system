import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Clock,
  User,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { ROUTES } from "../../constants";
import { useAuthStore } from "../../stores/auth.store";

interface SidebarProps {
  onSignOut?: () => void;
}

const SidebarTeacher: React.FC<SidebarProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  // 🎯 STATE QUẢN LÝ TRẠNG THÁI ẨN/HIỆN HỘP THOẠI XÁC NHẬN
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currentPath = location.pathname;

  // ===== ACTIVE LOGIC CHUẨN XÁC =====
  const isDashboard = currentPath === ROUTES.TEACHER.DASHBOARD;
  const isClasses = currentPath.startsWith(ROUTES.TEACHER.CLASSES);
  const isCreateSession = currentPath === ROUTES.TEACHER.CREATE_SESSION;
  const isHistory = currentPath === ROUTES.TEACHER.HISTORY;

  // 🎯 HÀM XỬ LÝ KHI NGƯỜI DÙNG BẤM NÚT XÁC NHẬN ĐĂNG XUẤT THẬT SỰ
  const handleConfirmSignOut = () => {
    setShowConfirmModal(false);
    if (onSignOut) {
      onSignOut();
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <>
      <aside className="w-[270px] h-screen bg-white border-r border-slate-200 flex flex-col justify-between p-6 md:p-8 fixed top-0 left-0 z-50">
        {/* TOP */}
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
              AI
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[15px] text-slate-900">
                EduSense
              </span>
              <span className="text-[10px] text-slate-500 tracking-[0.15em] font-bold">
                PLATFORM
              </span>
            </div>
          </div>

          {/* NAV */}
          <nav className="flex flex-col gap-2">
            {/* DASHBOARD */}
            <button
              onClick={() => navigate(ROUTES.TEACHER.DASHBOARD)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
                isDashboard
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <LayoutDashboard
                size={18}
                className={isDashboard ? "text-blue-600" : "text-slate-400"}
              />
              <span>Dashboard</span>
            </button>

            {/* MANAGE CLASSES */}
            <button
              onClick={() => navigate(ROUTES.TEACHER.CLASSES)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
                isClasses
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <BookOpen
                size={18}
                className={isClasses ? "text-blue-600" : "text-slate-400"}
              />
              <span>Manage Classes</span>
            </button>

            {/* CREATE SESSION */}
            <button
              onClick={() => navigate(ROUTES.TEACHER.CREATE_SESSION)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
                isCreateSession
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <PlusCircle
                size={18}
                className={isCreateSession ? "text-blue-600" : "text-slate-400"}
              />
              <span>Create Session</span>
            </button>

            {/* HISTORY */}
            <button
              onClick={() => navigate(ROUTES.TEACHER.HISTORY)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
                isHistory
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Clock
                size={18}
                className={isHistory ? "text-blue-600" : "text-slate-400"}
              />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-slate-100 pt-6">
          {/* USER INFO REALTIME */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
              <User size={16} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black text-slate-900 uppercase truncate">
                {user?.fullName || "EduSense Teacher"}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                {user?.role === "TEACHER" ? "Giảng viên" : "Hệ thống"}
              </span>
            </div>
          </div>

          {/* LOGOUT BUTTON - TRIGGER MODAL */}
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-xl hover:bg-red-50 transition-colors shadow-sm active:scale-[0.98]"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ==================== CONFIRM SIGN OUT MODAL ==================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
          {/* Backdrop làm mờ màn hình nền bên dưới */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowConfirmModal(false)}
          />

          {/* Hộp thoại chính (Card Content) */}
          <div className="bg-white w-[90%] max-w-md rounded-[2rem] p-6 shadow-xl border border-slate-100 relative z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            {/* Icon cảnh báo màu đỏ nhẹ */}
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <AlertTriangle size={26} />
            </div>

            {/* Nội dung tiêu đề */}
            <h3 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight">
              ĐĂNG XUẤT TÀI KHOẢN
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc hiện tại trên
              hệ thống EduSense?
            </p>

            {/* Khu vực 2 nút chức năng */}
            <div className="flex gap-3 w-full">
              {/* Nút hủy bỏ */}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold tracking-wider rounded-xl transition-colors active:scale-[0.99]"
              >
                HỦY BỎ
              </button>

              {/* Nút đồng ý đăng xuất */}
              <button
                onClick={handleConfirmSignOut}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold tracking-wider rounded-xl transition-colors shadow-md shadow-red-200 active:scale-[0.99]"
              >
                ĐĂNG XUẤT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarTeacher;
