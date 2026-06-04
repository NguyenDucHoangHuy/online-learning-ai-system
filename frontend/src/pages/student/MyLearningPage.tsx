// src/pages/student/MyLearningPage.tsx
import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  MapPin,
  BarChart2,
  Loader2,
  Bookmark,
  X,
} from "lucide-react";

import { useStudentHistory } from "../../services/sessions/sessions.queries";
import { ParticipantHistoryItem } from "../../types/api";
import { formatDate, formatTime } from "../../utils/date";

export default function MyLearningPage() {
  const [selectedReport, setSelectedReport] =
    useState<ParticipantHistoryItem | null>(null);
  const { data: historyResponse, isLoading } = useStudentHistory();
  const historyList = historyResponse?.data || [];

  return (
    <>
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          My <span className="text-blue-600">Learning</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Review your academic journey and previous classroom interactions
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-5xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
            <Loader2 className="animate-spin text-blue-600" size={36} />
            <p className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Loading your learning history...
            </p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm animate-in fade-in duration-300">
            <Bookmark className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Chua tim thay du lieu hoc tap
            </h3>
            <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
              Ban chua tung tham gia vao buoi hoc truc tuyen nao tren he thong
              EduSense.
            </p>
          </div>
        ) : (
          historyList.map((item) => {
            const session = item.session;
            const classData = session.class;

            return (
              <div
                key={item.id}
                className="bg-white rounded-[2rem] p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-300 hover:shadow-md transition-all duration-300 group animate-in fade-in slide-in-from-bottom-2 font-sans"
              >
                <div className="flex items-center gap-5 md:gap-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    <BarChart2 size={22} />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 mb-2.5 tracking-tight group-hover:text-blue-600 transition-colors uppercase line-clamp-1">
                      {session.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        <Calendar size={13} className="text-slate-400" />
                        <span className="text-slate-600">
                          {formatDate(item.joinedAt || item.createdAt)}
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                          item.joinStatus === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : item.joinStatus === "PENDING"
                              ? "bg-amber-50 text-amber-600 border border-amber-100"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <CheckCircle2 size={13} />
                        <span className="tracking-wide text-[10px] uppercase">
                          {item.joinStatus === "APPROVED"
                            ? "ATTENDED"
                            : item.joinStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 border-l border-slate-200 pl-3 md:pl-5">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="text-slate-700 uppercase font-mono">
                          {session.sessionCode} - {classData.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedReport(item)}
                  className="w-full md:w-auto bg-slate-950 hover:bg-slate-800 text-white px-6 py-4 rounded-xl text-[11px] font-bold tracking-widest transition-colors shadow-md flex items-center justify-center gap-2 flex-shrink-0 active:scale-[0.99]"
                >
                  REVIEW REPORT
                </button>
              </div>
            );
          })
        )}
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-white/60">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                  Review Report
                </p>
                <h2 className="text-2xl font-black text-slate-900">
                  Tong quan buoi hoc
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Ten buoi hoc
                </p>
                <p className="text-base font-black text-slate-900">
                  {selectedReport.session.title}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Ten lop/mon
                </p>
                <p className="text-base font-black text-slate-900">
                  {selectedReport.session.class.name}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Thoi gian hoc
                </p>
                <p className="text-base font-black text-slate-900">
                  {selectedReport.session.startedAt
                    ? `${formatDate(selectedReport.session.startedAt)} - ${formatTime(
                        selectedReport.session.startedAt,
                      )}`
                    : formatDate(
                        selectedReport.joinedAt ||
                          selectedReport.session.createdAt,
                      )}
                </p>
                {selectedReport.session.endedAt && (
                  <p className="mt-1 text-xs font-bold text-slate-500">
                    Ket thuc: {formatTime(selectedReport.session.endedAt)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">
                  Trang thai
                </p>
                <p className="text-base font-black text-emerald-700">
                  Da ket thuc
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
