// src/pages/teacher/SessionHistoryPage.tsx
import { useNavigate } from "react-router-dom";
import { BarChart2, Calendar, Hash, Eye, Play, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "../../constants";
import { api } from "../../lib/axios";
import { formatDate } from "../../utils/date";

// 🎯 FIX CHỐT LUỒNG TYPE-SAFE: Định kiểu cấu trúc gói tin Lịch sử bốc từ API Backend
interface HistorySessionItem {
  id: string;
  title: string;
  sessionCode: string;
  status: "ACTIVE" | "WAITING" | "FINISHED" | "ENDED" | string;
  createdAt: string;
  startedAt: string | null; // Bổ sung trường thời gian để tính toán Lazy Validation
  endedAt: string | null; // Bổ sung trường thời gian để tính toán Lazy Validation
  class: {
    code: string;
    name: string;
  };
}

export default function SessionHistoryPage() {
  const navigate = useNavigate();

  // 📡 KẾT NỐI API: Bốc sạch kho lịch sử các phòng học của riêng Giảng viên này
  const { data: sessionsList = [], isLoading } = useQuery<HistorySessionItem[]>(
    {
      queryKey: ["teacher-sessions-history"],
      queryFn: async () => {
        try {
          const res = await api.get<unknown>("/sessions/history");

          let rawHistoryArray: HistorySessionItem[] = [];

          // 🧠 THUẬT TOÁN TUẦN TRA ĐA TẦNG - SẠCH BÓNG CHỮ ANY
          if (Array.isArray(res.data)) {
            rawHistoryArray = res.data as HistorySessionItem[];
          } else if (res.data && typeof res.data === "object") {
            const dataObject = res.data as Record<string, unknown>;
            if ("data" in dataObject && Array.isArray(dataObject.data)) {
              rawHistoryArray = dataObject.data as HistorySessionItem[];
            }
          }

          console.log(
            "⏱️ [History Sessions API Log] Gói phản hồi thô từ Server:",
            res.data,
          );
          return rawHistoryArray;
        } catch (error: unknown) {
          console.error(
            "❌ [History Sessions Error Log] Lỗi gắp danh mục lịch sử:",
            error,
          );
          return [];
        }
      },
    },
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">
          Đang truy xuất kho lịch sử phòng học...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
      {sessionsList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium uppercase text-xs tracking-wider">
            Bạn chưa thực hiện phòng dạy nào trên hệ thống.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessionsList.map((session) => {
            // =================================================================
            // 🧠 BỘ SÀNG LỌC LAZY VALIDATION ĐỘNG CHO TRANG LỊCH SỬ
            // =================================================================
            const currentTime = new Date();
            let computedStatus = session.status;

            if (session.startedAt && session.endedAt) {
              const startTime = new Date(session.startedAt);
              const endTime = new Date(session.endedAt);

              if (
                session.status === "WAITING" &&
                currentTime >= startTime &&
                currentTime < endTime
              ) {
                computedStatus = "ACTIVE";
              } else if (
                (session.status === "ACTIVE" || session.status === "WAITING") &&
                currentTime >= endTime
              ) {
                computedStatus = "ENDED";
              }
            }

            // Phòng chỉ được phép RESUME khi trạng thái thực tế sau tính toán là ACTIVE
            const isSessionLive = computedStatus === "ACTIVE";
            // =================================================================

            return (
              <div
                key={session.id}
                className={`bg-white rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group ${
                  isSessionLive
                    ? "border-blue-200 ring-2 ring-blue-500/5 shadow-md shadow-blue-900/5"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* LEFT: THÔNG TIN CHI TIẾT PHÒNG HỌC */}
                <div className="flex items-center gap-5 md:gap-6 min-w-0 flex-1">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
                      isSessionLive
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                    }`}
                  >
                    <BarChart2 size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {session.class?.code} — {session.class?.name}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-lg mb-2 truncate group-hover:text-blue-700 transition-colors">
                      {session.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDate(session.createdAt)}
                      </div>

                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isSessionLive
                            ? "bg-emerald-100 text-emerald-700 animate-pulse"
                            : computedStatus === "FINISHED" ||
                                computedStatus === "ENDED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        <span
                          className={`w-1 h-1 rounded-full ${isSessionLive ? "bg-emerald-500 animate-ping" : "bg-slate-400"}`}
                        />
                        {computedStatus}
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                        <Hash size={14} className="text-slate-400" />
                        CODE:{" "}
                        <span className="font-mono text-indigo-600 font-bold tracking-wider">
                          {session.sessionCode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: CÁC NÚT ĐIỀU HƯỚNG HÀNH ĐỘNG */}
                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                  {isSessionLive && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          ROUTES.TEACHER_SESSION.replace(
                            ":sessionId",
                            session.id,
                          ),
                        )
                      }
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors hover:bg-blue-700 shadow-md shadow-blue-600/20"
                    >
                      <Play size={16} />
                      RESUME
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `${ROUTES.TEACHER.REPORT}?sessionId=${session.id}`,
                      )
                    }
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors hover:bg-slate-50 shadow-sm hover:border-slate-300"
                  >
                    <Eye size={16} />
                    REPORT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
