// src/pages/student/JoinClassPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Clock,
  BookOpen,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { ROUTES } from "../../constants";
import { useAuthStore } from "../../stores/auth.store";
import {
  useLookupSession,
  useStudentHistory,
} from "../../services/sessions/sessions.queries";
import { useJoinSessionRoom } from "../../services/participants/participants.queries";

export default function JoinClassPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  // 👤 1. Cá nhân hóa lời chào: Bốc thông tin danh tính thực tế từ Zustand Store
  const user = useAuthStore((state) => state.user);

  // 📡 2. CONNECT LAYER: Chuận bị dữ liệu gọi API tuần tự
  const { mutateAsync: lookupSession, isPending: isChecking } =
    useLookupSession();
  const { mutateAsync: joinSessionRoom, isPending: isJoining } =
    useJoinSessionRoom();

  // 📡 3. CONNECT LAYER: Tự động nạp lịch sử phòng học thật từ Database
  const { data: historyResponse, isLoading: isHistoryLoading } =
    useStudentHistory();
  const historyList = historyResponse?.data || [];

  const isProcessing = isChecking || isJoining;

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) return;

    let targetSessionId = "";

    try {
      // 📡 BƯỚC 1: Gọi lệnh kiểm tra mã CODE phòng học từ Backend
      const lookupResponse = await lookupSession(cleanCode);
      const lookupData =
        (lookupResponse as {
          id?: string;
          data?: { id?: string; status?: string; title?: string };
        }) || {};

      targetSessionId = lookupData?.id || lookupData?.data?.id || "";

      if (!targetSessionId) {
        throw new Error("Không thể định vị mã phòng học này trên hệ thống.");
      }

      // =======================================================================
      // 🎯 CHỐT CHẶN WORKFLOW GUARD: Bắt trạng thái WAITING ngay lúc nhập mã CODE
      // =======================================================================
      const sessionStatus =
        (lookupResponse as { status?: string })?.status ||
        lookupData?.data?.status ||
        "";
      const sessionTitle =
        (lookupResponse as { title?: string })?.title ||
        lookupData?.data?.title ||
        "lớp học";

      if (sessionStatus === "WAITING") {
        setError(
          `Buổi học "${sessionTitle}" hiện chưa được Giảng viên mở cửa bắt đầu. Vui lòng quay lại sau!`,
        );
        return; // 🛑 CHẶN ĐỨNG: Ngắt luồng tại đây, không cho chạy xuống Bước 2 tạo hàng đợi PENDING nữa
      }
      // =======================================================================

      // 📡 BƯỚC 2: Bắn POST ghi danh tạo bản ghi vào hàng đợi xin duyệt (Chỉ chạy khi phòng đã ACTIVE)
      const joinResponse = await joinSessionRoom(targetSessionId);
      const joinData =
        (joinResponse as {
          joinStatus?: string;
          data?: { joinStatus?: string };
        }) || {};
      const joinStatus =
        joinData?.joinStatus || joinData?.data?.joinStatus || "";

      // Đập tan bộ nhớ đệm cũ để dọn đường nạp lịch sử mới
      await queryClient.invalidateQueries({
        queryKey: ["sessions", "student-history"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["session", targetSessionId],
      });

      // 🎯 RẼ NHÁNH ĐỊNH TUYẾN CHUẨN KHI THÀNH CÔNG
      if (joinStatus === "APPROVED") {
        navigate(ROUTES.STUDY_ROOM.replace(":sessionId", targetSessionId));
      } else if (joinStatus === "PENDING") {
        navigate(`${ROUTES.STUDENT_WAITING}?sessionId=${targetSessionId}`);
      }
    } catch (err: unknown) {
      console.warn(
        "⚠️ [Join Class Rescue Radar] Nhận tín hiệu báo lỗi nghiệp vụ từ API:",
        err,
      );

      const errorObj = err as {
        response?: {
          status?: number;
          data?: { message?: string };
        };
        message?: string;
      };

      const errorStatus = errorObj?.response?.status;
      const serverMessage =
        errorObj?.response?.data?.message || errorObj?.message || "";

      // Kịch bản A: Nếu dính lỗi hàng đợi 409 Conflict hoặc chuỗi thông báo báo đã tham gia / chờ duyệt
      if (
        errorStatus === 409 ||
        serverMessage.toLowerCase().includes("pending") ||
        serverMessage.toLowerCase().includes("already")
      ) {
        console.log(
          "🚀 [Rescue Engine] Tự động bốc đầu học sinh sang Sảnh Chờ duyệt.",
        );
        if (targetSessionId) {
          navigate(`${ROUTES.STUDENT_WAITING}?sessionId=${targetSessionId}`);
          return;
        }
      }

      // Kịch bản B: Nếu dội mã trạng thái lỗi hoặc tin nhắn xác thực từ Backend báo phòng đã đóng hòm (400 Bad Request)
      if (
        errorStatus === 400 ||
        serverMessage.toLowerCase().includes("ended") ||
        serverMessage.toLowerCase().includes("kết thúc") ||
        serverMessage.toLowerCase().includes("finished")
      ) {
        setError(
          serverMessage ||
            "Buổi học thuộc mã CODE này đã kết thúc thời gian giảng dạy.",
        );
        return;
      }

      // Kịch bản C: Nếu dội lỗi 404 hoặc chuỗi báo không tìm thấy (Sai kí tự hoàn toàn)
      if (
        errorStatus === 404 ||
        serverMessage.toLowerCase().includes("not found")
      ) {
        setError(
          serverMessage ||
            "Mã phòng học không tồn tại trên hệ thống. Vui lòng kiểm tra lại kí tự!",
        );
        return;
      }

      setError(
        serverMessage ||
          "Mã phòng học không chính xác hoặc buổi học đã đóng cửa.",
      );
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-3 duration-500">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Welcome back,{" "}
          <span className="text-blue-600">{user?.fullName || "Học sinh"}</span>!
        </h1>
        <p className="text-slate-500 font-medium text-base">
          Ready to start your learning session?
        </p>
      </div>

      {error && (
        <div className="mb-6 max-w-6xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-semibold text-rose-600 flex items-center gap-3 animate-in fade-in duration-200">
          <ShieldAlert size={18} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        {/* CARD 1: FORM NHẬP MÃ CODE */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm flex flex-col h-[440px] justify-between">
          <div>
            <div className="w-14 h-14 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <Search size={22} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
              Join a Classroom
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm font-medium">
              Enter the unique session code provided by your teacher to enter
              the live interactive environment.
            </p>
          </div>

          <form onSubmit={handleJoinClass} className="flex flex-col gap-3">
            <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-1">
              Room Code
            </label>
            <input
              type="text"
              disabled={isProcessing}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Ví dụ: 8NV6KX"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-base font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all uppercase placeholder:text-slate-400 placeholder:normal-case disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isProcessing || !roomCode.trim()}
              className="w-full mt-1 bg-slate-950 hover:bg-slate-800 text-white rounded-xl py-4 text-sm font-bold tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin text-blue-400" />
                  PROCESSING REQUEST...
                </>
              ) : (
                <>
                  Enter Classroom <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* CARD 2: LỊCH SỬ THAM GIA */}
        <div className="bg-blue-600 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-blue-950/20 text-white flex flex-col h-[440px] relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 text-blue-700/40 pointer-events-none select-none">
            <Clock size={200} />
          </div>

          <div className="relative z-10 flex items-start gap-4 mb-6">
            <div className="w-14 h-14 bg-white/15 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/10 shadow-md">
              <Clock size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight mb-1">
                Joined Sessions
              </h2>
              <p className="text-blue-100 text-sm font-medium leading-relaxed">
                Danh sách các phòng học gần đây bạn đã tham gia học tập.
              </p>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>

            {isHistoryLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-blue-200">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Loading history...
                </span>
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <p className="text-sm text-blue-100 font-medium">
                  Bạn chưa từng tham gia buổi học nào.
                </p>
              </div>
            ) : (
              (
                historyList as {
                  id?: string;
                  session?: {
                    sessionCode?: string;
                    title?: string;
                    class?: { name?: string };
                  };
                }[]
              ).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isProcessing) return;
                    setRoomCode(item.session?.sessionCode || "");
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/5 shadow-sm">
                      <BookOpen size={16} className="text-blue-100" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white mb-0.5 group-hover:text-blue-50 transition-colors line-clamp-1">
                        {item.session?.title}
                      </h3>
                      <p className="text-[10px] font-bold text-blue-200 tracking-widest uppercase">
                        CODE: {item.session?.sessionCode} — LỚP:{" "}
                        {item.session?.class?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-blue-200 group-hover:text-white group-hover:translate-x-1 transition-all"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
