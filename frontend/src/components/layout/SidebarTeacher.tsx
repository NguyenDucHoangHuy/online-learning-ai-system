// src/components/layout/SidebarTeacher.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Clock,
  User,
  LogOut,
} from "lucide-react";
import { ROUTES } from "../../constants";
// 🎯 BỔ SUNG: Nạp kho trạng thái xác thực toàn cục
import { useAuthStore } from "../../stores/auth.store";

interface SidebarProps {
  onSignOut?: () => void;
}

const SidebarTeacher: React.FC<SidebarProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🎯 BỔ SUNG: Bốc thông tin Giảng viên đang đăng nhập thực tế
  const user = useAuthStore((s) => s.user);

  const currentPath = location.pathname;

  // ===== ACTIVE LOGIC =====
  const isDashboard = currentPath === ROUTES.TEACHER_DASHBOARD;
  const isClasses = currentPath === ROUTES.TEACHER_CLASSES;
  const isCreateSession = currentPath === ROUTES.TEACHER.CREATE_SESSION;
  const isHistory = currentPath === ROUTES.TEACHER.HISTORY;

  return (
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
            <span className="text-[10px] text-slate-400 tracking-[0.15em] font-bold">
              PLATFORM
            </span>
          </div>
        </div>

        {/* NAV */}
        <nav className="flex flex-col gap-2">
          {/* DASHBOARD */}
          <button
            onClick={() => navigate(ROUTES.TEACHER_DASHBOARD)}
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
            onClick={() => navigate(ROUTES.TEACHER_CLASSES)}
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
        {/* USER INFO BOX */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
            <User size={16} />
          </div>
          <div className="flex flex-col overflow-hidden">
            {/* 🎯 ĐÃ PHẲNG HÓA: Hiện chuẩn xác tên Giảng viên thực tế từ Auth Store */}
            <span className="text-xs font-black text-slate-800 truncate uppercase tracking-wide">
              {user?.fullName || "Giảng viên"}
            </span>
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
              Giảng viên
            </span>
          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={onSignOut || (() => navigate(ROUTES.LOGIN))}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-xl hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default SidebarTeacher;
