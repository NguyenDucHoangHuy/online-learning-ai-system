// src/pages/student/WaitingRoomPage.tsx
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  ArrowLeft,
  BookOpen,
  Loader2,
  ShieldAlert,
  Coffee,
} from "lucide-react";
import { ROUTES } from "../../constants";
import {
  useSessionDetail,
  useStudentHistory,
} from "../../services/sessions/sessions.queries";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";

  // 🎯 CHỐT 9: Gọi tĩnh KHÔNG polling, chỉ lấy metadata (Tên môn, tiêu đề) để hiển thị giao diện trực quan
  const { data: sessionResponse, isLoading: isDetailsLoading } =
    useSessionDetail(sessionId);
  const sessionData = sessionResponse?.data;

  // 📡 CHỐT 7: Nguồn dữ liệu đúng nghiệp vụ duy nhất — Polling lịch sử tham gia để săn tìm biến động duyệt phòng
  const { data: historyResponse } = useStudentHistory({
    refetchInterval: 3000, // Cứ mỗi 3 giây gọi API quét ngầm một lần
  });
  const historyList = historyResponse?.data || [];

  // 🎯 CHỐT 8: Rào chắn ngăn chặn tình trạng spam điều hướng liên tục khi component chưa kịp unmount
  const hasNavigated = useRef(false);

  // 🔄 LOOP NGHIỆP VỤ CHUẨN: Đồng bộ 100% logic phê duyệt cá nhân
  useEffect(() => {
    if (hasNavigated.current) return; // Nếu đã kích hoạt điều hướng rồi thì bỏ qua luồng check

    if (historyList.length > 0 && sessionId) {
      // Dò tìm chính xác hàng dữ liệu ghi danh của sinh viên này trong buổi học hiện tại
      const currentRoomRecord = historyList.find(
        (item) => item.sessionId === sessionId,
      );

      // KỊCH BẢN 1: Nếu Giảng viên bấm Phê duyệt (APPROVED)
      if (currentRoomRecord?.joinStatus === "APPROVED") {
        console.log("🎉 APPROVED -> Tiến quân thẳng vào phòng học WebRTC!");
        hasNavigated.current = true; // Khóa chốt rào chặn lập tức
        navigate(ROUTES.STUDENT.ROOM.replace(":sessionId", sessionId), {
          replace: true,
        });
        return;
      }

      // KỊCH BẢN 2: Nếu Giảng viên bấm Từ chối (REJECTED) hoặc xóa row khỏi danh sách chờ duyệt
      if (currentRoomRecord?.joinStatus === "REJECTED" || !currentRoomRecord) {
        console.warn("❌ Yêu cầu gia nhập phòng học bị từ chối.");
        alert("Giảng viên đã từ chối yêu cầu tham gia lớp học của bạn.");
        hasNavigated.current = true; // Khóa chốt rào chặn lập tức
        navigate(ROUTES.STUDENT.JOIN, { replace: true });
        return;
      }
    }
  }, [historyList, sessionId, navigate]);

  const handleCancelWait = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn hủy yêu cầu tham gia và quay lại trang tìm phòng không?",
      )
    ) {
      navigate(ROUTES.STUDENT.JOIN);
    }
  };

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
      <div className="max-w-xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 p-10 text-center shadow-sm">
        <ShieldAlert className="text-rose-500 mx-auto mb-4" size={48} />
        <h3 className="text-xl font-black text-slate-900 mb-2">
          Phiên làm việc không hợp lệ
        </h3>
        <p className="text-sm text-slate-500 font-medium mb-6">
          Không tìm thấy thông tin buổi học trực tuyến này trong hệ thống.
        </p>
        <button
          onClick={() => navigate(ROUTES.STUDENT.JOIN)}
          className="px-6 py-3 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          QUAY LẠI TRANG ĐĂNG NHẬP MÃ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              Môn học: {sessionData.class.name}
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
