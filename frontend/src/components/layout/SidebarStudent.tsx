import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Clock, User, LogOut, AlertTriangle } from "lucide-react";
import { ROUTES } from "../../constants";

// 🎯 IMPORT STORE TOÀN CỤC CỦA BẠN
import { useAuthStore } from "../../stores/auth.store";

interface SidebarProps {
  onSignOut?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 👤 LẤY THÔNG TIN USER ĐANG ĐĂNG NHẬP TỪ ZUSTAND STORE
  const user = useAuthStore((state) => state.user);

  // 🎯 STATE QUẢN LÝ TRẠNG THÁI ẨN/HIỆN HỘP THOẠI XÁC NHẬN ĐĂNG XUẤT
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Trích xuất tên hiển thị (nếu chưa load kịp thì fallback về "Sinh viên")
  const displayName = user?.fullName || "Sinh viên";

  // Lấy chữ cái đầu tiên của tên để làm ảnh đại diện Avatar tròn gọn đẹp
  const firstLetter = displayName.charAt(0).toUpperCase();

  const currentPath = location.pathname;

  // ===== ACTIVE LOGIC =====
  const isJoinActive = currentPath === ROUTES.STUDENT.JOIN;
  const isHistoryActive = currentPath === ROUTES.STUDENT.HISTORY;

  // ⚠️ ROOM có param nên phải dùng startsWith
  const isRoomActive = currentPath.startsWith("/student/room");

  // 🎯 HÀM XỬ LÝ KHI SINH VIÊN BẤM XÁC NHẬN ĐĂNG XUẤT THỰC SỰ
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
      <aside className="hidden w-[270px] h-screen bg-white border-r border-slate-200 md:flex flex-col justify-between p-6 md:p-8 fixed top-0 left-0 z-50">
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
            {/* JOIN CLASS */}
            <button
              onClick={() => navigate(ROUTES.STUDENT.JOIN)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
                isJoinActive || isRoomActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Home
                size={18}
                className={
                  isJoinActive || isRoomActive
                    ? "text-blue-600"
                    : "text-slate-400"
                }
              />
              <span>Join Class</span>
            </button>

            {/* HISTORY */}
            <button
              onClick={() => navigate(ROUTES.STUDENT.HISTORY)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
                isHistoryActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Clock
                size={18}
                className={isHistoryActive ? "text-blue-600" : "text-slate-400"}
              />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* BOTTOM */}
        <div className="border-t border-slate-100 pt-6">
          {/* USER INFO BOX */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
            {/* Avatar hiển thị chữ cái đầu tiên của user hoặc icon nếu rỗng */}
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black border border-blue-100 flex-shrink-0">
              {user?.fullName ? firstLetter : <User size={16} />}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span
                className="text-xs font-black text-slate-800 truncate uppercase tracking-tight"
                title={displayName}
              >
                {displayName}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mt-0.5">
                {user?.role === "STUDENT" ? "Học sinh" : "Người dùng"}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans animate-in fade-in duration-200">
          {/* Backdrop mờ nền */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />

          {/* Hộp thoại nội dung chính */}
          <div className="bg-white w-[90%] max-w-md rounded-[2rem] p-6 shadow-xl border border-slate-100 relative z-10 animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            {/* Icon cảnh báo */}
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <AlertTriangle size={26} />
            </div>

            {/* Tiêu đề thông báo */}
            <h3 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight">
              ĐĂNG XUẤT TÀI KHOẢN
            </h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản học sinh của mình
              trên hệ thống EduSense?
            </p>

            {/* Khối button lựa chọn */}
            <div className="flex gap-3 w-full">
              {/* Hủy bỏ */}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold tracking-wider rounded-xl transition-colors active:scale-[0.99]"
              >
                HỦY BỎ
              </button>

              {/* Xác nhận đăng xuất */}
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

export default Sidebar;
