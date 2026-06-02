import {
  Calendar,
  CheckCircle2,
  MapPin,
  BarChart2,
  Loader2,
  Bookmark,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "../../utils/date";

// 🎯 IMPORT STORE TOÀN CỤC VÀ FILE TYPE CHUẨN CỦA BẠN
import { useAuthStore } from "../../stores/auth.store";
import { ParticipantHistoryItem } from "../../types/api/session.types";

// 📡 ĐỊNH NGHĨA URL GỐC KHÔNG CÓ /API
// (Vì file router của bạn đã viết sẵn cứng cụm "/sessions/my-history")
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// 📐 ĐỊNH NGHĨA INTERFACE TRẢ VỀ TỪ BACKEND ĐỂ FIX LỖI ESLINT ANY
interface BackendResponse {
  statusCode: number;
  message: string;
  data: ParticipantHistoryItem[];
}

// 🌐 CUSTOM HOOK KẾT NỐI API BACKEND
const useStudentHistory = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery<BackendResponse>({
    queryKey: ["student-history", accessToken],
    queryFn: async () => {
      // 🎯 KHỚP HOÀN TOÀN VỚI ROUTER CỦA BẠN: http://localhost:3000/sessions/my-history
      const response = await fetch(`${BASE_URL}/sessions/my-history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Không thể tải lịch sử học tập từ hệ thống",
        );
      }

      return response.json();
    },
    enabled: !!accessToken,
  });
};

// ==================== MAIN COMPONENT ====================
export default function MyLearningPage() {
  const { data: apiResponse, isLoading, isError, error } = useStudentHistory();

  // 🛡️ BÓC TÁCH DỮ LIỆU AN TOÀN TỪ CẤU TRÚC sendResponse CỦA CONTROLLER
  const historyList: ParticipantHistoryItem[] = apiResponse?.data || [];

  return (
    <>
      {/* Header */}
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          My <span className="text-blue-600">Learning</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Review your academic journey and previous classroom interactions
        </p>
      </div>

      {/* KHU VỰC DANH SÁCH LỊCH SỬ HỌC TẬP */}
      <div className="flex flex-col gap-4 max-w-5xl">
        {/* TH 1: Đang chờ Backend trả kết quả */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
            <Loader2 className="animate-spin text-blue-600" size={36} />
            <p className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Loading your learning history...
            </p>
          </div>
        ) : /* TH 2: Xuất hiện lỗi hệ thống */
        isError ? (
          <div className="text-center py-20 bg-red-50 text-red-600 rounded-[2.5rem] border border-red-200 shadow-sm">
            <p className="font-bold mb-1">Đã có lỗi hệ thống xảy ra</p>
            <p className="text-xs text-red-400 font-mono">
              {(error as Error).message}
            </p>
          </div>
        ) : /* TH 3: Mảng dữ liệu trống */
        historyList.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm animate-in fade-in duration-300">
            <Bookmark className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Chưa tìm thấy dữ liệu học tập
            </h3>
            <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">
              Bạn chưa từng tham gia vào buổi học trực tuyến nào trên hệ thống
              EduSense.
            </p>
          </div>
        ) : (
          /* TH 4: Hiển thị dữ liệu thực tế mượt mà */
          historyList.map((item: ParticipantHistoryItem) => {
            const session = item?.session;
            const classData = session?.class;

            if (!session || !classData) return null;

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
                          {session.sessionCode} — {classData.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() =>
                    alert(
                      `Đang tiến hành trích xuất dữ liệu phân tích cảm xúc cho buổi học: ${session.title}`,
                    )
                  }
                  className="w-full md:w-auto bg-slate-950 hover:bg-slate-800 text-white px-6 py-4 rounded-xl text-[11px] font-bold tracking-widest transition-colors shadow-md flex items-center justify-center gap-2 flex-shrink-0 active:scale-[0.99]"
                >
                  REVIEW REPORT
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
