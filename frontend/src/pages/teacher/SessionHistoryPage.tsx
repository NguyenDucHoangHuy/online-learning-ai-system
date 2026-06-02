// src/pages/teacher/SessionHistoryPage.tsx
import { useNavigate } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  BarChart2,
  Calendar,
  Clock,
  Hash,
  Eye,
  Play,
  Loader2,
} from "lucide-react";

// 📡 Quản lý Trạm trung chuyển URL động tập trung (Xóa ROUTES để fix lỗi no-unused-vars)
import { getDynamicRoute } from "../../constants";
import { SESSION_STATUS } from "../../constants/session.constants";
import { formatDate } from "../../utils/date";

// 📡 Service và Hook kết nối dữ liệu từ Database
import { useClasses } from "../../services/classes/classes.queries";
import { sessionsService } from "../../services/sessions/sessions.service";
import { SessionItem } from "../../types/api";

export default function SessionHistoryPage() {
  const navigate = useNavigate();

  // 1. Lấy danh sách các lớp học của Giáo viên
  const { data: classesResponse, isLoading: isClassesLoading } = useClasses();
  const classesList = classesResponse?.data || [];

  // 2. Kích hoạt hàng loạt request lấy session của từng lớp học song song
  const sessionsQueries = useQueries({
    queries: classesList.map((cls) => ({
      queryKey: ["sessions", "class", cls.id],
      queryFn: () => sessionsService.getSessionsByClassId(cls.id),
      enabled: !!cls.id,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const isSessionsLoading = sessionsQueries.some((query) => query.isLoading);

  // 3. Gộp toàn bộ mảng dữ liệu từ các lớp học lại thành một danh sách duy nhất
  const sessionList: SessionItem[] = sessionsQueries.reduce<SessionItem[]>(
    (acc, query) => {
      if (query.data?.data && Array.isArray(query.data.data)) {
        return [...acc, ...query.data.data];
      }
      return acc;
    },
    [],
  );

  // Sắp xếp các buổi học mới nhất lên đầu dựa trên thời gian tạo
  sessionList.sort((a, b) => {
    const dateA = new Date(a.createdAt ?? a.startedAt ?? 0).getTime();
    const dateB = new Date(b.createdAt ?? b.startedAt ?? 0).getTime();
    return dateB - dateA;
  });

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

      {/* Trạng thái loading dữ liệu */}
      {isClassesLoading || isSessionsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="font-semibold text-sm">
            Đang tổng hợp lịch sử các buổi học từ database...
          </p>
        </div>
      ) : sessionList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium">
            Không tìm thấy lịch sử buổi học nào trong các lớp học của bồ.
          </p>
        </div>
      ) : (
        /* Danh sách lịch sử các buổi học */
        <div className="flex flex-col gap-4">
          {sessionList.map((item: SessionItem) => {
            const isActive = item.status === SESSION_STATUS.ACTIVE;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 md:p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group ${
                  isActive
                    ? "border-blue-200 shadow-blue-900/5 ring-1 ring-emerald-500/10"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* LEFT: Khối thông tin buổi học */}
                <div className="flex items-center gap-5 md:gap-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      isActive
                        ? "bg-blue-600 text-white animate-pulse"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <BarChart2 size={24} />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 uppercase tracking-tight">
                      {item.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        {/* 🛠️ FIX: Đã bọc dự phòng chuỗi rỗng chống lỗi dữ liệu null */}
                        {formatDate(item.createdAt || item.startedAt || "")}
                      </div>

                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md uppercase tracking-wider text-[10px] ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : item.status === SESSION_STATUS.WAITING
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <Clock size={14} />
                        {item.status}
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                        <Hash size={14} className="text-slate-400" />
                        CODE:{" "}
                        <span className="font-mono text-indigo-600 font-bold">
                          {item.sessionCode}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Khối nút chức năng điều hướng */}
                <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                  {isActive && (
                    <button
                      onClick={() =>
                        navigate(getDynamicRoute.teacherSession(item.id))
                      }
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors hover:bg-blue-700 shadow-md shadow-blue-600/20"
                    >
                      <Play size={16} />
                      RESUME
                    </button>
                  )}

                  <button
                    onClick={() =>
                      navigate(getDynamicRoute.teacherReport(item.id))
                    }
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3.5 rounded-xl text-xs font-bold tracking-widest transition-colors hover:bg-slate-50 shadow-sm"
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
