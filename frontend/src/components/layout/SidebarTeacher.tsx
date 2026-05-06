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

interface SidebarProps {
  onSignOut?: () => void;
}

const SidebarTeacher: React.FC<SidebarProps> = ({ onSignOut }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  // ===== ACTIVE LOGIC =====
  const isDashboard = currentPath === ROUTES.TEACHER.DASHBOARD;
  const isClasses = currentPath === ROUTES.TEACHER.CLASSES;
  const isCreateSession = currentPath === ROUTES.TEACHER.CREATE_SESSION;
  const isHistory = currentPath === ROUTES.TEACHER.HISTORY;

  // ⚠️ SESSION có param
  // const isSession = currentPath.startsWith("/teacher/session");

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
        {/* USER */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
            <User size={16} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-700 truncate">
              HOÀNG HUY
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
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
