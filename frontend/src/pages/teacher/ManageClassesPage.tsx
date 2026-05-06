// src/pages/teacher/ManageClassesPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  PlusCircle,
  Search,
  MoreVertical,
  Calendar,
  Bell,
  ArrowLeft,
  Copy,
  Video,
  Clock,
  Hash,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import CreateClassModal from "./CreateClassModal";
import { ROUTES } from "../../constants";

// --- Kiểu dữ liệu ---
interface ClassItem {
  id: number;
  title: string;
  description: string;
  created: string;
}

interface SessionItem {
  id: string;
  title: string;
  date: string;
  time: string;
  sessionCode: string;
  status: "Upcoming" | "Completed" | "Ongoing";
}

// --- Dữ liệu giả lập ---
const mockClasses: ClassItem[] = [
  {
    id: 1,
    title: "NEURAL NETWORKS 401",
    description: "Advanced deep learning architectures and backpropagation.",
    created: "JAN 15, 2026",
  },
  {
    id: 2,
    title: "DIGITAL SOCIOLOGY",
    description: "Impact of social algorithms on human behavior.",
    created: "FEB 10, 2026",
  },
  {
    id: 3,
    title: "QUANTUM CRYPTOGRAPHY",
    description: "Securing data through quantum entanglement.",
    created: "MAR 05, 2026",
  },
];

const mockSessionsByClassId: Record<number, SessionItem[]> = {
  1: [
    {
      id: "s1",
      title: "Midterm Exam Review",
      date: "MAY 10, 2026",
      time: "09:00 AM",
      sessionCode: "8NV6KX",
      status: "Upcoming",
    },
    {
      id: "s2",
      title: "Intro to Backpropagation",
      date: "MAY 06, 2026",
      time: "10:30 AM",
      sessionCode: "X92M1B",
      status: "Completed",
    },
  ],
  2: [
    {
      id: "s3",
      title: "Social Media Algorithms",
      date: "MAY 12, 2026",
      time: "02:00 PM",
      sessionCode: "SOCIAL22",
      status: "Upcoming",
    },
  ],
  3: [],
};

const ManageClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Đã copy mã: ${code}`);
  };

  return (
    // Bỏ div flex ngoài cùng vì TeacherLayout đã có
    <div className="relative z-0 max-w-7xl mx-auto">
      {/* --- TRẠNG THÁI 1: HIỂN THỊ DANH SÁCH CLASSES --- */}
      {!selectedClass && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                My <span className="text-blue-600">Classes</span>
              </h2>
              <p className="text-slate-500 mt-1 text-lg font-medium">
                Curate and manage your academic subjects
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white rounded-full px-6 py-2.5 text-[11px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
              >
                <PlusCircle size={16} /> CREATE DISCIPLINE
              </Button>

              <div className="flex gap-2">
                <button className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-all shadow-sm">
                  <Search size={18} />
                </button>
                <button className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-all shadow-sm relative">
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
              placeholder="Filter by subject name..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {mockClasses.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onClick={() => setSelectedClass(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* --- TRẠNG THÁI 2: HIỂN THỊ DANH SÁCH SESSIONS --- */}
      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setSelectedClass(null)}
                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">
                    DISCIPLINE VIEW
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {selectedClass.title}
                </h1>
              </div>
            </div>

            <Button
              onClick={() => navigate(ROUTES.TEACHER.CREATE_SESSION)}
              className="bg-blue-600 text-white rounded-2xl px-6 py-3.5 text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
            >
              <Video size={18} /> NEW SESSION
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              Sessions List
              <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2.5 rounded-lg font-bold">
                {mockSessionsByClassId[selectedClass.id]?.length || 0}
              </span>
            </h3>

            {mockSessionsByClassId[selectedClass.id]?.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 mb-4 font-medium">
                  No sessions created for this discipline yet.
                </p>
                <Button
                  onClick={() => navigate(ROUTES.TEACHER.CREATE_SESSION)}
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-full text-xs"
                >
                  Create First Session
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {mockSessionsByClassId[selectedClass.id].map((session) => (
                  <div
                    key={session.id}
                    className="group flex flex-col xl:flex-row xl:items-center justify-between p-6 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
                          session.status === "Upcoming"
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-slate-200 text-slate-400"
                        }`}
                      >
                        <Video size={20} />
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                          {session.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} /> {session.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> {session.time}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest ${
                              session.status === "Upcoming"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t xl:border-t-0 xl:border-l border-slate-200 pt-4 xl:pt-0 xl:pl-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Session Code
                        </span>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm group-hover:border-indigo-200 transition-colors">
                          <Hash size={14} className="text-indigo-500" />
                          <span className="font-mono font-bold text-indigo-700 tracking-widest">
                            {session.sessionCode}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCode(session.sessionCode);
                            }}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="Copy Code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

// --- COMPONENT: ClassCard ---
const ClassCard: React.FC<{ item: ClassItem; onClick: () => void }> = ({
  item,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between h-[340px] relative hover:shadow-lg hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer"
  >
    <div>
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
          <BookOpen size={28} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <MoreVertical size={24} />
        </button>
      </div>

      <h3 className="text-xl font-extrabold text-slate-900 mb-3 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors">
        {item.title}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm line-clamp-3">
        {item.description}
      </p>
    </div>

    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-blue-50/50 transition-colors w-full">
        <Calendar size={14} className="text-blue-600" />
        <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
          Created <br /> <span className="text-slate-600">{item.created}</span>
        </div>
      </div>
    </div>
  </div>
);

export default ManageClassesPage;
