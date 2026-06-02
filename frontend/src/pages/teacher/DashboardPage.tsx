// src/pages/teacher/DashboardPage.tsx
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  PlusCircle,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "../../constants";
import { useAuthStore } from "../../stores/auth.store";
import { api } from "../../lib/axios";
import { formatDate } from "../../utils/date";

// Khế ước định kiểu cho gói tin thống kê tổng hợp từ Backend gửi lên
interface DashboardStats {
  totalClasses: number;
  totalSessions: number;
  avgAttention: number;
  questionsAsked: number;
  classesChange: string;
  sessionsChange: string;
  attentionChange: string;
  questionsChange: string;
}

// Khế ước định kiểu cho thực thể Buổi học gần đây (Cập nhật Type-safe chuẩn DateTime?)
interface RecentSessionItem {
  id: string;
  title: string;
  createdAt: string;
  startedAt: string | null; // 🎯 CHỐT HẠ: Chấp nhận Nullable lịch trình
  endedAt: string | null; // 🎯 CHỐT HẠ: Chấp nhận Nullable lịch trình
  status: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  // 👥 Trích xuất danh tính động của Giảng viên đăng nhập từ Zustand Store
  const user = useAuthStore((s) => s.user);

  // 📡 QUERY 1: Bốc các chỉ số thống kê tổng hợp của riêng Giảng viên này
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ["teacher-dashboard-stats"],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: DashboardStats }>(
          "/classes/dashboard/stats",
        );

        console.log(
          "📊 [Dashboard Debug API] Gói dữ liệu thô từ Backend dội về:",
          res.data,
        );

        // 🎯 BIỆN PHÁP CỨU HỘ CHỐT HẠ:
        // Nếu res.data.data bị undefined, hệ thống tự động bốc dữ liệu thô từ res.data.
        // Nếu vẫn không có, trả về một Object mặc định chứa toàn số 0 chứ quyết không để undefined vỡ luồng!
        return (
          res.data?.data ||
          (res.data as unknown as DashboardStats) || {
            totalClasses: 0,
            totalSessions: 0,
            avgAttention: 0,
            questionsAsked: 0,
            classesChange: "+0%",
            sessionsChange: "+0%",
            attentionChange: "+0%",
            questionsChange: "+0%",
          }
        );
      } catch (error) {
        console.error("❌ Lỗi gọi API Dashboard Stats:", error);
        // Fallback an toàn khi dính lỗi mạng hoặc lỗi Server ngầm
        return {
          totalClasses: 0,
          totalSessions: 0,
          avgAttention: 0,
          questionsAsked: 0,
          classesChange: "+0%",
          sessionsChange: "+0%",
          attentionChange: "+0%",
          questionsChange: "+0%",
        };
      }
    },
  });

  // 📡 QUERY 2: Lấy danh sách các buổi học vừa mới diễn ra gần đây nhất
  const { data: recentSessions = [], isLoading: isRecentLoading } = useQuery<
    RecentSessionItem[]
  >({
    queryKey: ["teacher-recent-sessions"],
    queryFn: async () => {
      try {
        // Gọi API đón nhận gói tin dưới dạng unknown để bảo vệ kiến trúc
        const res = await api.get<unknown>("/sessions/recent");

        let rawSessionsArray: RecentSessionItem[] = [];

        // 🧠 KIỂM TRA ĐA TẦNG TOÀN DIỆN - SẠCH BÓNG CHỮ ANY
        if (Array.isArray(res.data)) {
          // Trường hợp 1: Backend trả về trực tiếp một mảng thô
          rawSessionsArray = res.data as RecentSessionItem[];
        } else if (res.data && typeof res.data === "object") {
          // Trường hợp 2: Backend trả về Object bọc vỏ { success: true, data: [...] }
          // Ép kiểu Object về dạng Record an toàn thay vì dùng any
          const dataObject = res.data as Record<string, unknown>;

          if ("data" in dataObject && Array.isArray(dataObject.data)) {
            rawSessionsArray = dataObject.data as RecentSessionItem[];
          }
        }

        console.log(
          "⏱️ [Recent Sessions API Log] Gói phản hồi thô từ Server:",
          res.data,
        );
        console.log(
          "📦 [Recent Sessions API Log] Mảng data thực tế bốc được:",
          rawSessionsArray,
        );

        return rawSessionsArray;
      } catch (error: unknown) {
        console.error(
          "❌ [Recent Sessions Error Log] Lỗi kết nối luồng gắp dữ liệu:",
          error,
        );
        return [];
      }
    },
  });
  // Khối định nghĩa cấu trúc giao diện bọc các dữ liệu động bốc từ Query 1
  const statsCards = [
    {
      label: "TOTAL CLASSES",
      value: statsData?.totalClasses ?? 0,
      change: statsData?.classesChange || "+0%",
      trend: "up",
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    },
    {
      label: "TOTAL SESSIONS",
      value: statsData?.totalSessions ?? 0,
      change: statsData?.sessionsChange || "+0%",
      trend: "up",
      icon: <Activity className="w-5 h-5 text-emerald-600" />,
    },
    {
      label: "AVG. ATTENTION",
      value: statsData?.avgAttention ? `${statsData.avgAttention}%` : "0%",
      change: statsData?.attentionChange || "+0%",
      trend: "up",
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "QUESTIONS ASKED",
      value: statsData?.questionsAsked ?? 0,
      change: statsData?.questionsChange || "-0%",
      trend: (statsData?.questionsAsked ?? 0) >= 100 ? "up" : "down",
      icon: <TrendingDown className="w-5 h-5 text-orange-600" />,
    },
  ];

  // 🧠 BỘ LỌC ĐỘNG LAZY VALIDATION UI: Tự nắn dòng trạng thái hiển thị của Row lịch sử sang trạng thái thực tế
  const computedRecentSessions = recentSessions.map((session) => {
    const currentTime = new Date();
    let displayStatus = session.status;

    if (session.startedAt && session.endedAt) {
      const startTime = new Date(session.startedAt);
      const endTime = new Date(session.endedAt);

      if (
        session.status === "WAITING" &&
        currentTime >= startTime &&
        currentTime < endTime
      ) {
        displayStatus = "ACTIVE";
      } else if (
        (session.status === "ACTIVE" || session.status === "WAITING") &&
        currentTime >= endTime
      ) {
        displayStatus = "ENDED";
      }
    }

    return {
      ...session,
      status: displayStatus,
    };
  });

  const isPageLoading = isStatsLoading || isRecentLoading;

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={44} />
        <p className="font-bold text-xs uppercase tracking-widest text-slate-400">
          Đang nạp dữ liệu phân tích hệ thống...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <header className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-6 mb-10">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Teacher <span className="text-blue-600">Dashboard</span>
          </h2>
          <p className="text-slate-500 mt-1 text-lg font-medium">
            Welcome back, {user?.fullName || "Professor"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full shadow-sm text-sm font-bold text-slate-600">
            <Clock size={16} className="text-blue-600" />{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

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

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {statsCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 group hover:shadow-md hover:border-blue-100 transition-all hover:-translate-y-1 cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                {stat.icon}
              </div>
              <div
                className={`flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                  stat.trend === "up"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-rose-50 text-rose-600"
                }`}
              >
                {stat.trend === "up" ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : (
                  <TrendingDown size={12} className="mr-1" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">
              {stat.label}
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      {/* SECTION BIỂU ĐỒ & RECENT SESSIONS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Biểu đồ dạng sóng Attention */}
        <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 min-h-[400px] flex flex-col justify-between">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                Engagement Overview
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                Average Attention Span
              </p>
            </div>

            <button
              onClick={() => navigate(ROUTES.TEACHER.CREATE_SESSION)}
              className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md shadow-slate-200"
            >
              <PlusCircle size={14} /> NEW SESSION
            </button>
          </div>

          {/* Khung Biểu đồ SVG mô phỏng dạng sóng AI Attention Tracker của lớp */}
          <div className="flex-1 w-full bg-blue-50/50 rounded-[2rem] border-2 border-dashed border-blue-200 flex items-center justify-center relative overflow-hidden mt-4">
            <div className="absolute inset-0 flex items-end">
              <svg
                viewBox="0 0 400 100"
                preserveAspectRatio="none"
                className="w-full h-full text-blue-500 opacity-20"
              >
                <path
                  d="M0,50 Q50,20 100,50 T200,35 T300,65 T400,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            </div>
            <p className="text-blue-500 font-extrabold text-sm uppercase tracking-widest z-10 bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm">
              Attention Waveform Active
            </p>
          </div>
        </div>

        {/* Recent Sessions List */}
        <div className="bg-slate-950 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col xl:col-span-1">
          <h3 className="text-xl font-bold mb-6 tracking-tight">
            Recent Sessions
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[320px] pr-1">
            {computedRecentSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs font-bold uppercase tracking-wider">
                Chưa có buổi học nào diễn ra
              </div>
            ) : (
              computedRecentSessions.map((session) => {
                // 🎯 BỘ PHÒNG VỆ AN TOÀN TUYỆT ĐỐI CHỐT HẠ:
                // Nếu startedAt bị null (do phòng chưa phát sóng), lấy trường thời gian tạo createdAt thay thế làm điểm tựa fallback
                const fallbackTime = session.startedAt
                  ? new Date(session.startedAt)
                  : new Date(session.createdAt);

                return (
                  <div
                    key={session.id}
                    className="flex items-center gap-4 p-4 bg-slate-900 hover:bg-blue-600/20 rounded-2xl transition-all cursor-pointer group border border-slate-800 relative overflow-hidden"
                    onClick={() =>
                      navigate(`${ROUTES.TEACHER.HISTORY}?focus=${session.id}`)
                    }
                  >
                    <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-blue-600 transition-colors shadow-sm">
                      <Clock
                        size={20}
                        className="text-blue-400 group-hover:text-white"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold truncate uppercase tracking-wide text-slate-100 max-w-[70%]">
                          {session.title}
                        </h4>
                        {/* Huy hiệu Badge trạng thái hiển thị chuẩn xác real-time */}
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded-md font-black tracking-widest ${
                            session.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : session.status === "ENDED"
                                ? "bg-slate-800 text-slate-400"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-widest uppercase font-mono">
                        {formatDate(session.createdAt)} •{" "}
                        {fallbackTime.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <ChevronRight
                      size={18}
                      className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0"
                    />
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => navigate(ROUTES.TEACHER.HISTORY)}
            className="w-full mt-8 py-4 border border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-slate-900 transition-all flex-shrink-0"
          >
            View All History
          </button>
        </div>
      </div>
    </div>
  );
}
