import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  History,
  LogOut,
  Search,
  MoreVertical,
  Calendar,
  Bell,
} from "lucide-react";

// Import các thành phần nội bộ
import { Button } from "../../components/ui/Button";
import ClassesPage from "./ClassesPage";

interface ClassItem {
  id: number;
  title: string;
  description: string;
  enrolled: number;
  created: string;
}

type ClassCardProps = Omit<ClassItem, "id">;

const ManageClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const classes: ClassItem[] = [
    {
      id: 1,
      title: "NEURAL NETWORKS 401",
      description: "Advanced deep learning architectures and backpropagation.",
      enrolled: 0,
      created: "JAN 15, 2026",
    },
    {
      id: 2,
      title: "DIGITAL SOCIOLOGY",
      description: "Impact of social algorithms on human behavior.",
      enrolled: 0,
      created: "FEB 10, 2026",
    },
    {
      id: 3,
      title: "QUANTUM CRYPTOGRAPHY",
      description: "Securing data through quantum entanglement.",
      enrolled: 0,
      created: "MAR 05, 2026",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-slate-800 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 fixed h-full z-20">
        <div
          className="flex items-center gap-3 mb-10 px-2 cursor-pointer transition-transform active:scale-95"
          onClick={() => navigate("/teacher/dashboard")}
        >
          {/* Đã đổi bg-indigo-600 thành bg-[#2563EB] */}
          <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">
            AI
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-slate-900">
              EduSense
            </h1>
            {/* Đã đổi text-indigo-500 thành text-[#2563EB] */}
            <span className="text-[10px] font-bold text-[#2563EB] tracking-widest uppercase">
              Platform
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all font-medium"
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button
            onClick={() => navigate("/teacher/classes")}
            className="flex items-center gap-3 w-full p-3 bg-blue-50 text-[#2563EB] rounded-xl font-semibold transition-all shadow-sm shadow-blue-50/50"
          >
            <BookOpen size={20} /> Manage Classes
          </button>

          <button
            onClick={() => navigate("/teacher/create-session")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-[#2563EB] hover:text-white rounded-xl transition-all font-medium group"
          >
            <PlusCircle
              size={20}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            Create Session
          </button>

          <button
            onClick={() => navigate("/teacher/history")}
            className="flex items-center gap-3 w-full p-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-all font-medium"
          >
            <History size={20} /> History
          </button>
        </nav>

        <div className="mt-auto">
          <button className="flex items-center gap-3 w-full p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-bold group">
            <LogOut
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-10">
        <header className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
              My <span className="text-[#2563EB]">Classes</span>
            </h2>
            <p className="text-slate-500 mt-1 text-lg font-medium">
              Curate and manage your active academic subjects
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#1E293B] text-white rounded-full px-6 py-2.5 text-[11px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <PlusCircle size={16} /> CREATE DISCIPLINE
            </Button>

            <div className="flex gap-2">
              <button className="p-2.5 bg-white border border-gray-100 rounded-full text-slate-400 hover:text-[#2563EB] transition-all shadow-sm">
                <Search size={18} />
              </button>
              <button className="p-2.5 bg-white border border-gray-100 rounded-full text-slate-400 hover:text-[#2563EB] transition-all shadow-sm relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
          </div>
        </header>

        <div className="relative mb-12 max-w-xl">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Filter by subject name or code..."
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 font-medium transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map((item) => (
            <ClassCard
              key={item.id}
              title={item.title}
              description={item.description}
              enrolled={item.enrolled}
              created={item.created}
            />
          ))}
        </div>
      </main>

      <ClassesPage isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

const ClassCard: React.FC<ClassCardProps> = ({
  title,
  description,
  enrolled,
  created,
}) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-between h-[380px] relative hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
    <div>
      <div className="flex justify-between items-start mb-8">
        {/* Đã đổi bg-indigo-50 và hover:bg-indigo-600 */}
        <div className="p-4 bg-blue-50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors shadow-sm">
          <BookOpen size={28} />
        </div>
        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
          <MoreVertical size={24} />
        </button>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 mb-3 leading-tight uppercase tracking-tight group-hover:text-[#2563EB] transition-colors">
        {title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm">
        {description}
      </p>
    </div>

    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white"></div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white"></div>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase leading-none tracking-wider">
          {enrolled} <br /> <span className="text-[9px]">Enrolled</span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-gray-100">
        <Calendar size={14} className="text-[#2563EB]" />
        <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
          Created <br /> <span className="text-slate-600">{created}</span>
        </div>
      </div>
    </div>
  </div>
);

export default ManageClassesPage;
