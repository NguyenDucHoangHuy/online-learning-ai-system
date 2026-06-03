// src/components/ui/ParticipantList.tsx
import { useState } from "react";
import {
  X,
  Check,
  Users,
  Clock,
  Shield,
  Mic,
  Video,
  UserMinus,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/axios";
import { ParticipantItem } from "../../types/api/participant.types";
import { useAuthStore } from "../../stores/auth.store";

// 🎯 KIẾN TRÚC MỞ RỘNG: Chấp nhận cả kiểu UIParticipantItem mở rộng chứa trường role từ trang cha truyền vào
interface UIParticipantItem extends ParticipantItem {
  role?: "TEACHER" | "STUDENT";
}

interface ParticipantListProps {
  onlineParticipants: UIParticipantItem[]; // Đồng bộ kiểu mảng mở rộng
  pendingParticipants: UIParticipantItem[];
  onQueueActionSuccess: (
    participantId: string,
    action: "APPROVE" | "REJECT",
  ) => void;
  onClose: () => void;
}

export default function ParticipantList({
  onlineParticipants,
  pendingParticipants,
  onQueueActionSuccess,
  onClose,
}: ParticipantListProps) {
  // Trích xuất danh tính người đang mở tab trình duyệt hiện tại
  const currentUser = useAuthStore((s) => s.user);

  // Khai phá xem trong mảng Online có ai mang vai trò TEACHER thực thụ không
  const actualTeacher = onlineParticipants.find((p) => p.role === "TEACHER");

  // 🎫 STATE TABS: Tự động ưu tiên nhảy sang Tab "Chờ duyệt" nếu có học sinh đang xếp hàng
  const [activeTab, setActiveTab] = useState<"active" | "pending">(
    pendingParticipants.length > 0 ? "pending" : "active",
  );

  // 📡 MUTATION 1: Gọi lệnh PATCH duyệt Học sinh vào lớp
  const { mutate: approveStudent, isPending: isApproving } = useMutation({
    mutationFn: async (participantId: string) => {
      const res = await api.patch(`/participants/${participantId}/approve`);
      return res.data;
    },
    onSuccess: (_, participantId) => {
      onQueueActionSuccess(participantId, "APPROVE");
    },
    onError: (err: unknown) => {
      alert(
        err instanceof Error ? err.message : "Phê duyệt học sinh thất bại.",
      );
    },
  });

  // 📡 MUTATION 2: Gọi lệnh PATCH từ chối Học sinh khỏi hàng đợi
  const { mutate: rejectStudent, isPending: isRejecting } = useMutation({
    mutationFn: async (participantId: string) => {
      const res = await api.patch(`/participants/${participantId}/reject`);
      return res.data;
    },
    onSuccess: (_, participantId) => {
      onQueueActionSuccess(participantId, "REJECT");
    },
    onError: (err: unknown) => {
      alert(err instanceof Error ? err.message : "Từ chối học sinh thất bại.");
    },
  });

  const isProcessing = isApproving || isRejecting;

  // 🎯 LUỒNG TÍNH TOÁN CON SỐ HIỂN THỊ CHUẨN XÁC:
  // Nếu người đang mở trình duyệt là HỌC SINH, mảng onlineParticipants đã bao gồm cả Giáo viên (đếm chuẩn).
  // Nếu người đang mở trình duyệt là GIÁO VIÊN, mảng onlineParticipants chỉ chứa Học sinh -> Phải cộng thêm 1 (chính thầy cô).
  const isCurrentUserTeacher = currentUser?.role === "TEACHER";
  const totalInClassCount = isCurrentUserTeacher
    ? onlineParticipants.length + 1
    : onlineParticipants.length + 1; // Bản phối đồng bộ tổng lực lượng

  // Lọc riêng danh sách sinh viên thực thụ (Bỏ dòng giáo viên ra để loop riêng ở dưới)
  const studentOnlyList = onlineParticipants.filter(
    (p) => p.role !== "TEACHER",
  );

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-white/5 w-80 shadow-2xl text-white font-sans animate-in fade-in slide-in-from-right-4 duration-300">
      {/* SIDEBAR HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/20">
        <div className="flex items-center gap-2.5">
          <Users size={16} className="text-blue-400" />
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
            Người tham gia ({totalInClassCount})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* TABS NAVIGATION CONTROL */}
      <div className="px-3 pt-3 pb-1 flex border-b border-white/5 gap-1.5 bg-slate-950/40">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black tracking-wide transition-all uppercase flex items-center justify-center gap-1.5 border ${
            activeTab === "active"
              ? "bg-slate-800 text-blue-400 border-white/5 shadow-inner"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Trong lớp ({totalInClassCount})
        </button>

        {/* Chỉ hiển thị tab Quyền lực "Chờ duyệt" nếu người đang xem là GIÁO VIÊN */}
        {isCurrentUserTeacher && (
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black tracking-wide transition-all uppercase flex items-center justify-center gap-1.5 border relative ${
              activeTab === "pending"
                ? "bg-slate-800 text-amber-400 border-white/5 shadow-inner"
                : "text-slate-400 border-transparent hover:text-slate-200"
            }`}
          >
            Chờ duyệt ({pendingParticipants.length})
            {pendingParticipants.length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse absolute top-2 right-3" />
            )}
          </button>
        )}
      </div>

      {/* LIST CONTAINER LAYER */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {/* ================= TÁC CHIẾN TABS 1: SẢNH CHỜ (CHỈ DÀNH CHO GIÁO VIÊN XEM) ================= */}
        {activeTab === "pending" &&
          isCurrentUserTeacher &&
          (pendingParticipants.length === 0 ? (
            <div className="text-center py-16 text-slate-500 flex flex-col items-center justify-center gap-2 bg-slate-950/20 rounded-2xl border border-dashed border-white/5 m-1">
              <Clock size={28} className="text-slate-600 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Sảnh chờ trống rỗng
              </p>
            </div>
          ) : (
            pendingParticipants.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-slate-950/40 border border-white/5 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-right-2 duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center text-xs font-black uppercase flex-shrink-0">
                    {item.student?.fullName?.charAt(0) || "S"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                      {item.student?.fullName}
                    </h4>
                    <p className="text-[9px] font-semibold text-slate-500 truncate mt-0.5">
                      {item.student?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    disabled={isProcessing}
                    onClick={() => approveStudent(item.id)}
                    className="p-1.5 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg border border-emerald-500/20 transition-all active:scale-95 disabled:opacity-40"
                    title="Duyệt vào lớp"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => rejectStudent(item.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg border border-rose-500/20 transition-all active:scale-95 disabled:opacity-40"
                    title="Từ chối"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))
          ))}

        {/* ================= TÁC CHIẾN TABS 2: LỰC LƯỢNG ĐANG TRONG LỚP HỌC ================= */}
        {activeTab === "active" && (
          <div className="space-y-2">
            {/* 👨‍🏫 Ô CỐ ĐỊNH 1: HIỂN THỊ GIÁO VIÊN CHỦ PHÒNG (DYNAMIC IDENTITY) */}
            <div className="p-3 bg-slate-950/40 border border-blue-500/20 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-black border border-blue-500/20 shadow-md">
                  GV
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    {/* Nếu mình là Giáo viên -> Hiện tên mình. Nếu mình là Học sinh -> Hiện tên Giáo viên bốc từ mảng online về */}
                    {isCurrentUserTeacher
                      ? currentUser?.fullName
                      : actualTeacher?.student?.fullName || "Giảng viên"}
                    <Shield size={12} className="text-blue-400 fill-blue-400" />
                  </h4>
                  <p className="text-[9px] font-bold text-blue-400/80 uppercase tracking-widest mt-0.5">
                    Chủ phòng dạy
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-slate-400">
                <Mic size={13} />
                <Video size={13} />
              </div>
            </div>

            {/* 🧑‍🎓 Ô LẶP 2: DANH SÁCH SINH VIÊN THỰC THỤ */}
            {studentOnlyList.length === 0 && isCurrentUserTeacher ? (
              <div className="text-center py-12 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                Chưa có học sinh trong phòng
              </div>
            ) : (
              <>
                {/* Ở màn hình Học sinh, tự chèn thêm chính tài khoản học sinh của mình vào hàng ngũ Sinh viên */}
                {!isCurrentUserTeacher && currentUser && (
                  <div className="p-3 bg-slate-950/30 border border-emerald-500/10 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0">
                        Bạn
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-emerald-400 truncate">
                          {currentUser.fullName}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">
                          Sinh viên (Tôi)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Mic size={13} />
                      <Video size={13} />
                    </div>
                  </div>
                )}

                {/* Vòng lặp vẽ ra các học sinh khác trong phòng */}
                {studentOnlyList.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-950/15 hover:bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-slate-800 text-slate-300 rounded-xl flex items-center justify-center text-xs font-extrabold uppercase border border-white/5 flex-shrink-0">
                        {item.student?.fullName?.charAt(0) || "S"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-300 group-hover:text-blue-400 transition-colors truncate">
                          {item.student?.fullName}
                        </h4>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide font-mono mt-0.5">
                          Sinh viên
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Mic size={13} />
                      <Video size={13} />
                      {/* Quyền sinh sát: Chỉ có Giáo viên mới nhìn thấy nút kick học sinh */}
                      {isCurrentUserTeacher && (
                        <button
                          className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 text-slate-600 transition-all"
                          title="Mời ra khỏi lớp"
                          onClick={() =>
                            alert(
                              `Tính năng kích học sinh khỏi lớp sẽ được triển khai ở Presence Flow!`,
                            )
                          }
                        >
                          <UserMinus size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
