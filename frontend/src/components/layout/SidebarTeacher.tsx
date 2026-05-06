// src/components/layout/SidebarTeacher.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Clock,
  User,
  LogOut,
} from "lucide-react";
import { ROUTES } from "../../constants"; // Import ROUTES

interface SidebarProps {
  onSignOut?: () => void;
  activeItem?: string;
}

const SidebarTeacher: React.FC<SidebarProps> = ({
  onSignOut,
  activeItem = "Dashboard",
}) => {
  const navigate = useNavigate();

  return (
    <aside className="w-[270px] h-screen bg-white border-r border-slate-200 flex flex-col justify-between p-6 md:p-8 fixed top-0 left-0 z-50">
      {/* KHU VỰC TRÊN: Logo và Menu điều hướng */}
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
            AI
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] text-slate-900 leading-tight">
              EduSense
            </span>
            <span className="text-[10px] text-slate-500 tracking-[0.15em] font-bold mt-0.5">
              PLATFORM
            </span>
          </div>
        </div>

        {/* Nav Menu */}
        <nav className="flex flex-col gap-2">
          {/* Dashboard */}
          <button
            onClick={() => navigate(ROUTES.TEACHER.DASHBOARD)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
              activeItem === "Dashboard"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <LayoutDashboard
              size={18}
              className={
                activeItem === "Dashboard" ? "text-blue-600" : "text-slate-400"
              }
            />
            <span>Dashboard</span>
          </button>

          {/* Manage Classes */}
          <button
            onClick={() => navigate(ROUTES.TEACHER.CLASSES)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
              activeItem === "Manage Classes"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <BookOpen
              size={18}
              className={
                activeItem === "Manage Classes"
                  ? "text-blue-600"
                  : "text-slate-400"
              }
            />
            <span>Manage Classes</span>
          </button>

          {/* Create Session */}
          <button
            onClick={() => navigate(ROUTES.TEACHER.CREATE_SESSION)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
              activeItem === "Create Session"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <PlusCircle
              size={18}
              className={
                activeItem === "Create Session"
                  ? "text-blue-600"
                  : "text-slate-400"
              }
            />
            <span>Create Session</span>
          </button>

          {/* History */}
          <button
            onClick={() => navigate(ROUTES.TEACHER.HISTORY)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
              activeItem === "History"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Clock
              size={18}
              className={
                activeItem === "History" ? "text-blue-600" : "text-slate-400"
              }
            />
            <span>History</span>
          </button>
        </nav>
      </div>

      {/* KHU VỰC DƯỚI: User Profile và Sign Out */}
      <div className="border-t border-slate-100 pt-6">
        {/* User Profile */}
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
            <User size={16} />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-700 truncate">
              HOÀNG HUY
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
              Giảng viên
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
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
