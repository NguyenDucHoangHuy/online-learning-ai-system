import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Clock, User, LogOut } from "lucide-react";

interface SidebarProps {
  onSignOut?: () => void;
  activeItem?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  onSignOut,
  activeItem = "Join Class",
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
          {/* Join Class Button */}
          <button
            onClick={() => navigate("/student")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all w-full text-left ${
              activeItem === "Join Class"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Home
              size={18}
              className={
                activeItem === "Join Class" ? "text-blue-600" : "text-slate-400"
              }
            />
            <span>Join Class</span>
          </button>

          {/* History Button */}
          <button
            onClick={() => navigate("/student/my-learning")}
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
              Sinh viên
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut || (() => navigate("/login"))}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-500 font-bold text-xs rounded-xl hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
