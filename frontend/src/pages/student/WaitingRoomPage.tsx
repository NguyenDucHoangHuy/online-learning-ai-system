// src/pages/student/WaitingRoomPage.tsx
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query"; // 🎯 BỔ SUNG
import {
  Clock,
  ArrowLeft,
  BookOpen,
  Loader2,
  ShieldAlert,
  Coffee,
} from "lucide-react";
import { ROUTES } from "../../constants";
import { SOCKET_EVENTS } from "../../constants/events.constants";
import {
  useSessionDetail,
  useStudentHistory,
} from "../../services/sessions/sessions.queries";
import { useSocket } from "../../socket/socket.client";
import { api } from "../../lib/axios";

interface ExpectedSessionData {
  id: string;
  title: string;
  sessionCode: string;
  status: string;
  class: { id: string; name: string };
}

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // 🎯 BỔ SUNG
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";

  const { socket, isConnected } = useSocket();
  const hasNavigated = useRef(false);

  const { data: sessionResponse, isLoading: isDetailsLoading } =
    useSessionDetail(sessionId);
  const sessionData = sessionResponse
    ? (sessionResponse as unknown as ExpectedSessionData)
    : null;

  // 📡 REST 2: Cài polling 3 giây làm mới lịch sử để bọc lót tuyệt đối nếu socket nghẽn
  const { data: historyResponse, isLoading: isHistoryLoading } =
    useStudentHistory({
      refetchInterval: 3000,
    });
  const historyList = historyResponse?.data || [];

  // 🔌 LUỒNG CHỮA CHÁY: Ép Socket.io khôi phục kết nối nếu bị ngắt trước đó
  useEffect(() => {
    if (socket && !isConnected) {
      console.log(
        "🔌 [WaitingRoom] Phát hiện Socket đang đóng. Ép khởi động kết nối hỏa tốc...",
      );
      socket.connect();
    }
  }, [socket, isConnected]);

  // 🔄 LUỒNG 1: Xử lý cứu hộ khẩn cấp ngay khi vừa mount trang
  useEffect(() => {
    if (
      hasNavigated.current ||
      isHistoryLoading ||
      !sessionId ||
      !historyList.length
    )
      return;

    const rawHistoryArray = historyList as unknown as Array<{
      sessionId: string;
      session?: { id: string };
      joinStatus?: string;
      status?: string;
    }>;

    const initialRecord = rawHistoryArray.find(
      (item) => item.sessionId === sessionId || item.session?.id === sessionId,
    );

    const currentStatus = initialRecord?.joinStatus || initialRecord?.status;
    console.log(
      "🔍 [WaitingRoom Radar Check] Trạng thái bản ghi hiện tại:",
      currentStatus,
    );

    if (currentStatus === "APPROVED") {
      hasNavigated.current = true;
      // Xóa bộ nhớ đệm trước khi bay vào lớp
      queryClient.invalidateQueries({
        queryKey: ["sessions", "student-history"],
      });
      navigate(ROUTES.STUDY_ROOM.replace(":sessionId", sessionId), {
        replace: true,
      });
    } else if (currentStatus === "REJECTED") {
      hasNavigated.current = true;
      alert("Giảng viên đã từ chối yêu cầu tham gia lớp học của bạn.");
      navigate(ROUTES.STUDENT_JOIN, { replace: true });
    }
  }, [historyList, isHistoryLoading, sessionId, navigate, queryClient]);

  // ⚡ LUỒNG 2: ĐỘNG CƠ REAL-TIME KÍCH NỔ CHUYỂN TRANG LẬP TỨC
  useEffect(() => {
    if (!socket || !sessionId) return;

    console.log(
      "🛰️ [WaitingRoom] Đang lắng nghe tín hiệu phê duyệt từ giảng viên...",
    );

    socket.on(
      SOCKET_EVENTS.PARTICIPANT_APPROVED,
      (payload: { sessionId: string }) => {
        if (hasNavigated.current) return;
        if (payload.sessionId === sessionId) {
          console.log("🟢 [Real-time Socket] Giảng viên đã duyệt vào lớp!");
          hasNavigated.current = true;
          queryClient.invalidateQueries({
            queryKey: ["sessions", "student-history"],
          });
          navigate(ROUTES.STUDY_ROOM.replace(":sessionId", sessionId), {
            replace: true,
          });
        }
      },
    );

    socket.on(
      SOCKET_EVENTS.PARTICIPANT_REJECTED,
      (payload: { sessionId: string }) => {
        if (hasNavigated.current) return;
        if (payload.sessionId === sessionId) {
          hasNavigated.current = true;
          alert("Giảng viên đã từ chối yêu cầu tham gia lớp học của bạn.");
          navigate(ROUTES.STUDENT_JOIN, { replace: true });
        }
      },
    );

    return () => {
      console.log(
        "🧹 [WaitingRoom] Thu hồi toàn bộ Listener phòng chờ sinh viên.",
      );
      socket.off(SOCKET_EVENTS.PARTICIPANT_APPROVED);
      socket.off(SOCKET_EVENTS.PARTICIPANT_REJECTED);
    };
  }, [socket, sessionId, navigate, queryClient]);

  // 🎯 THUẬT TOÁN HỦY HÀNG CHỜ ĐỒNG BỘ ĐA TẦNG
  const handleCancelWait = async () => {
    if (
      !window.confirm(
        "Bạn có chắc chắn muốn hủy yêu cầu tham gia và quay lại trang tìm phòng không?",
      )
    ) {
      return;
    }

    try {
      console.log(
        "📡 [WaitingRoom] Phát lệnh hủy hàng chờ đồng bộ xuống Database...",
      );

      // Tái sử dụng endpoint leave thông minh để chuyển bản ghi PENDING sang LEFT dưới DB
      // và kích nổ Socket thông báo cho Giáo viên trừ số lượng hàng chờ ngay lập tức!
      await api.patch(`/sessions/${sessionId}/leave`);

      // Khơi thông bộ nhớ đệm lịch sử của học sinh
      queryClient.invalidateQueries({
        queryKey: ["sessions", "student-history"],
      });
    } catch (err) {
      console.warn(
        "⚠️ [WaitingRoom Cancel] Không thể đồng bộ lệnh hủy lên Server:",
        err,
      );
    } finally {
      // Hộ tống học sinh quay về sảnh chính nhập mã
      navigate(ROUTES.STUDENT_JOIN, { replace: true });
    }
  };

  // Chờ nạp thông tin tĩnh ban đầu
  if (isDetailsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-slate-500">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="font-bold text-sm tracking-wide">
          ĐANG ĐỒNG BỘ DỮ LIỆU PHÒNG CHỜ...
        </p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 p-10 text-center shadow-sm mt-10">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-xl font-black text-slate-900 mb-2">
          Phiên làm việc không hợp lệ
        </h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Không tìm thấy thông tin buổi học trực tuyến này trong hệ thống hoặc
          định dạng trả về bị lệch pha.
        </p>
        <button
          onClick={() => navigate(ROUTES.STUDENT_JOIN)}
          className="px-6 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          QUAY LẠI TRANG ĐĂNG NHẬP MÃ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
      {/* Nút thoát nhanh ở góc */}
      <button
        onClick={handleCancelWait}
        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 transition-colors mb-8 group"
      >
        <ArrowLeft
          size={16}
          className="group-hover:-translate-x-1 transition-transform"
        />{" "}
        Hủy yêu cầu vào lớp
      </button>

      {/* KHUNG TRUNG TÂM PHÒNG CHỜ */}
      <div className="bg-white border border-slate-200 rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
        {/* Radar Animation */}
        <div className="relative w-24 h-24 flex items-center justify-center mb-8">
          <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping duration-1000" />
          <div className="absolute inset-4 bg-blue-500/20 rounded-full animate-pulse" />
          <div className="relative w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Clock size={24} className="animate-spin [animation-duration:8s]" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
          Waiting for <span className="text-blue-600">Approval</span>
        </h1>

        {/* 🟢 ĐÈN CHỈ BÁO KẾT NỐI REAL-TIME TRỰC QUAN TRÊN UI */}
        <div className="mb-8 flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-bold tracking-wide uppercase">
          <span
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
          />
          <span className={isConnected ? "text-emerald-600" : "text-rose-600"}>
            {isConnected
              ? "Real-time Pipeline Active"
              : "Connecting to socket..."}
          </span>
        </div>

        <p className="text-slate-500 font-medium max-w-md text-sm leading-relaxed mb-8">
          Yêu cầu gia nhập của bạn đã được gửi đi thành công. Vui lòng giữ
          nguyên màn hình, Giảng viên sẽ phê duyệt cho bạn vào lớp ngay bây giờ.
        </p>

        {/* Classroom Metadata Box */}
        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase block mb-0.5">
              Môn học: {sessionData.class?.name || "N/A"}
            </span>
            <h4 className="font-extrabold text-slate-900 text-base leading-tight uppercase">
              {sessionData.title}
            </h4>
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase mt-1.5 tracking-wider">
              <span>Code: {sessionData.sessionCode}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>Trạng thái: {sessionData.status}</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-400 flex items-center gap-2 bg-slate-50/50 px-4 py-2 rounded-full border border-slate-100">
          <Coffee size={14} className="text-amber-500" /> Chuẩn bị sẵn Webcam và
          tai nghe trong lúc chờ bồ nhé!
        </div>
      </div>
    </div>
  );
}
