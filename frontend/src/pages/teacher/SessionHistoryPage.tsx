// src/pages/teacher/SessionHistoryPage.tsx
import { useNavigate } from "react-router-dom";
import { BarChart2, Calendar, Clock, Hash, Eye, Play } from "lucide-react";
import { ROUTES } from "../../constants";

const sessionData = [
  {
    id: 1,
    title: "NEURAL NETWORKS ARCHITECTURE",
    date: "4/20/2026",
    status: "ARCHIVED",
    idCode: "AI-902",
    isActive: false,
  },
  {
    id: 2,
    title: "MACROECONOMIC PRINCIPLES",
    date: "4/25/2026",
    status: "ARCHIVED",
    idCode: "ECON-1",
    isActive: false,
  },
  {
    id: 3,
    title: "QUANTUM COMPUTING INTRO",
    date: "4/28/2026",
    status: "ARCHIVED",
    idCode: "PHY-8",
    isActive: false,
  },
  {
    id: 4,
    title: "ADVANCED UX PATTERNS",
    date: "5/6/2026",
    status: "ACTIVE CHANNEL",
    idCode: "CS-505",
    isActive: true,
  },
];

export default function SessionHistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-2">
          Session History
        </h1>
        <p className="text-slate-500 font-medium">
          Review past classrooms and emotional analysis reports
        </p>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {sessionData.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group ${
              item.isActive
                ? "border-blue-200 shadow-blue-900/5"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {/* LEFT */}
            <div className="flex items-center gap-5 md:gap-6">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  item.isActive
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <BarChart2 size={24} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900 mb-3">{item.title}</h3>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {item.date}
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Clock size={14} />
                    {item.status}
                  </div>

                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                    <Hash size={14} className="text-slate-400" />
                    ID: {item.idCode}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
              {item.isActive && (
                <button
                  onClick={() =>
                    navigate(
                      ROUTES.TEACHER.SESSION.replace(":sessionId", item.idCode),
                    )
                  }
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors hover:bg-blue-700 shadow-md shadow-blue-600/20"
                >
                  <Play size={16} />
                  RESUME
                </button>
              )}

              <button
                onClick={() => navigate(ROUTES.TEACHER.REPORT)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors hover:bg-slate-50 shadow-sm"
              >
                <Eye size={16} />
                REPORT
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
