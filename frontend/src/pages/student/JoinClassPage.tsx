// src/pages/student/JoinClassPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, BookOpen, ArrowRight } from "lucide-react";
import Sidebar from "../../components/layout/SidebarStudent"; // Giữ nguyên import sidebar của bạn
import { ROUTES } from "../../constants";

// Data mẫu cho các session đang diễn ra
const ongoingSessions = [
  { id: 1, title: "Advanced Robotics Lab", roomCode: "ROBO-1" },
  { id: 2, title: "Circuit Design Patterns", roomCode: "CIRC-2" },
  { id: 3, title: "Digital Art & Geometry", roomCode: "ART-99" },
  { id: 4, title: "Political Economics", roomCode: "POL-10" },
];

export default function JoinClassPage() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    // Điều hướng tới trang StudyRoom kèm theo mã code vừa nhập
    navigate(ROUTES.STUDENT.ROOM.replace(":sessionId", roomCode));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar - Cần cấu hình fixed bên trong component này */}
      <Sidebar activeItem="Join Class" />

      {/* Main Content Area */}
      <main className="flex-1 ml-[330px] p-10 md:p-14 lg:p-20 overflow-y-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
            Welcome back, Hoàng Huy!
          </h1>
          <p className="text-slate-500 font-medium">
            Ready to start your learning session?
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
          {/* CARD 1: JOIN CLASSROOM (Trắng) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-[440px] justify-between">
            <div>
              <div className="w-14 h-14 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Search size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Join a Classroom
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                Enter the unique session code provided by your teacher to enter
                the live interactive environment.
              </p>
            </div>

            <form onSubmit={handleJoinClass} className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Ví dụ: MATH-101"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all uppercase"
              />
              <button
                type="submit"
                className="w-full mt-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl py-4 text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-colors shadow-md shadow-slate-900/10"
              >
                Enter Classroom <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* CARD 2: ONGOING SESSIONS (Xanh) */}
          <div className="bg-blue-600 rounded-3xl p-8 shadow-xl shadow-blue-900/20 text-white flex flex-col h-[440px]">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Ongoing Sessions</h2>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Quickly jump back into active classes you are currently
                  enrolled in.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {ongoingSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() =>
                    navigate(
                      ROUTES.STUDENT.ROOM.replace(
                        ":sessionId",
                        session.roomCode,
                      ),
                    )
                  }
                  className="bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <BookOpen size={18} className="text-blue-100" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white mb-0.5 group-hover:text-blue-50 transition-colors">
                        {session.title}
                      </h3>
                      <p className="text-[11px] font-semibold text-blue-200/80 tracking-wider">
                        {session.roomCode}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-blue-200 group-hover:text-white group-hover:-translate-x-1 transition-all"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
