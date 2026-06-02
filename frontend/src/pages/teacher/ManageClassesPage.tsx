// src/pages/teacher/ManageClassesPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query"; // 🎯 BỔ SUNG: Nạp queryClient để dọn cache
import {
  BookOpen,
  PlusCircle,
  Search,
  MoreVertical,
  Calendar,
  Bell,
  ArrowLeft,
  Video,
  Clock,
  Hash,
  Loader2,
  Copy,
  LogIn,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import CreateClassModal from "./CreateClassModal";
import { ROUTES } from "../../constants";
import { SESSION_STATUS } from "../../constants/session.constants";
import { formatDate, formatTime } from "../../utils/date";
import { useClasses } from "../../services/classes/classes.queries";
import { useClassSessions } from "../../services/sessions/sessions.queries";
import { api } from "../../lib/axios"; // 🎯 BỔ SUNG: Nạp axios instance gọi API trực tiếp
import { ClassItem } from "../../types/api";

interface ClassSessionItem {
  id: string;
  classId: string;
  title: string;
  sessionCode: string;
  status: "WAITING" | "ACTIVE" | "ENDED"; // Hoặc bồ truyền chuẩn Enum SESSION_STATUS nếu có định kiểu literal
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

const ManageClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // 🎯 KHOI TẠO ĐỂ LÀM SẠCH CACHE REST
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 📡 Gọi API lấy danh sách lớp học
  const { data: classesResponse, isLoading: isClassesLoading } = useClasses();
  const classesList = classesResponse?.data || [];

  // 📡 Gọi API lấy danh sách buổi học
  const { data: sessionsResponse, isLoading: isSessionsLoading } =
    useClassSessions(selectedClass?.id || "");

  const sessionsList = sessionsResponse?.data || [];

  const filteredClasses = classesList.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error("Không thể sao chép mã phòng:", err);
    }
  };

  /**
   * 🚀 ĐIỀU HƯỚNG VÀ KÍCH HOẠT PHÒNG DẠY THÔNG MINH (WORKFLOW GUARD)
   * 🎯 ĐÃ CHỈNH SỬA: Chặn luồng WAITING, xin quyền mở phòng rồi mới cho vào trang dạy
   */
  const handleEnterLiveRoom = async (session: ClassSessionItem) => {
    // Kịch bản A: Nếu buổi học vẫn đang nằm im ở trạng thái WAITING dưới DB
    if (session.status === SESSION_STATUS.WAITING) {
      const confirmOpen = window.confirm(
        `Buổi học "${session.title}" chưa tới giờ bắt đầu theo lịch trình hệ thống.\n\nBạn có chắc chắn muốn kích hoạt mở lớp và phát sóng giảng dạy NGAY BÂY GIỜ không?`,
      );

      // Nếu Thầy cô bấm Hủy -> Chặn đứng, không cho chuyển vùng trang
      if (!confirmOpen) return;

      console.log(
        "⚡ [Workflow Guard] Giáo viên xác nhận mở lớp sớm. Đang bắn API Start Session...",
      );
      try {
        // Gọi lệnh PATCH /api/sessions/:sessionId/start lên Express Backend của bồ
        await api.patch(`/sessions/${session.id}/start`);

        // Làm sạch bộ nhớ đệm để sảnh ngoài tự động cập nhật chữ WAITING -> ACTIVE xanh mướt
        await queryClient.invalidateQueries({
          queryKey: ["session-participants-pending", session.id],
        });

        if (selectedClass?.id) {
          await queryClient.invalidateQueries({
            queryKey: ["sessions", selectedClass.id], // Key React Query bốc session theo lớp của bồ
          });
        }
      } catch (err) {
        console.error(
          "🚨 [Start Session Error] Không thể nắn dòng trạng thái phòng sang ACTIVE:",
          err,
        );
        alert(
          "Gặp sự cố kết nối hệ thống. Không thể kích hoạt buổi học lúc này, vui lòng thử lại!",
        );
        return;
      }
    }

    // Sau khi nắn trạng thái thành công hoặc phòng vốn dĩ đã ACTIVE -> Hộ tống vào thẳng phòng dạy
    const targetPath = ROUTES.TEACHER.SESSION.replace(":sessionId", session.id);
    navigate(targetPath);
  };

  return (
    <div className="relative z-0 max-w-7xl mx-auto">
      {/* --- TRẠNG THÁI 1: HIỂN THỊ DANH SÁCH CLASSES --- */}
      {!selectedClass && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-start gap-6 mb-10">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                My <span className="text-blue-600">Classes</span>
              </h2>
              <p className="text-slate-500 mt-1 text-lg font-medium">
                Curate and manage your academic subjects
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 text-white rounded-full px-6 py-2.5 text-[11px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
              >
                <PlusCircle size={16} /> CREATE DISCIPLINE
              </Button>

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

          <div className="relative mb-12 max-w-xl">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by subject name or class code..."
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          {isClassesLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="font-semibold text-sm">
                Đang tải danh sách lớp học...
              </p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
              <p className="text-slate-500 font-medium">
                Không tìm thấy lớp học nào phù hợp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredClasses.map((item) => (
                <ClassCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedClass(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TRẠNG THÁI 2: HIỂN THỊ DANH SÁCH SESSIONS --- */}
      {selectedClass && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <button
                onClick={() => setSelectedClass(null)}
                className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen size={16} className="text-blue-600" />
                  <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">
                    DISCIPLINE VIEW — {selectedClass.code}
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {selectedClass.name}
                </h1>
              </div>
            </div>

            <Button
              onClick={() =>
                navigate(
                  `${ROUTES.TEACHER.CREATE_SESSION}?classId=${selectedClass.id}`,
                )
              }
              className="bg-blue-600 text-white rounded-2xl px-6 py-3.5 text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
            >
              <Video size={18} /> NEW SESSION
            </Button>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              Sessions List
              <span className="bg-slate-100 text-slate-600 text-xs py-1 px-2.5 rounded-lg font-bold">
                {isSessionsLoading ? "..." : sessionsList.length}
              </span>
            </h3>

            {isSessionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : sessionsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-500 mb-4 font-medium">
                  No sessions created for this discipline yet.
                </p>
                <Button
                  onClick={() =>
                    navigate(
                      `${ROUTES.TEACHER.CREATE_SESSION}?classId=${selectedClass.id}`,
                    )
                  }
                  className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-full text-xs"
                >
                  Create First Session
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {sessionsList.map((session: ClassSessionItem) => {
                  const isLiveActive = session.status === SESSION_STATUS.ACTIVE;
                  const isLiveWaiting =
                    session.status === SESSION_STATUS.WAITING;
                  const canEnter = isLiveActive || isLiveWaiting;

                  return (
                    <div
                      key={session.id}
                      // 🎯 ĐÃ SỬA: Chuyển hướng xử lý click mảng bọc qua hàm handleEnterLiveRoom bảo vệ workflow
                      onClick={() => canEnter && handleEnterLiveRoom(session)}
                      className={`group flex flex-col xl:flex-row xl:items-center justify-between p-6 rounded-2xl border transition-all duration-300 gap-4 ${
                        canEnter
                          ? "bg-white hover:bg-blue-50/40 border-slate-100 hover:border-blue-200 cursor-pointer hover:shadow-sm"
                          : "bg-slate-50 border-slate-100 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-5 min-w-0 flex-1">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
                            isLiveActive
                              ? "bg-emerald-500 text-white animate-pulse"
                              : isLiveWaiting
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          <Video size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4
                            className={`font-bold text-lg transition-colors truncate ${
                              canEnter
                                ? "text-slate-900 group-hover:text-blue-700"
                                : "text-slate-500"
                            }`}
                          >
                            {session.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-1">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={14} />{" "}
                              {formatDate(session.createdAt)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />{" "}
                              {formatTime(session.startedAt)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                                isLiveActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isLiveWaiting
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {session.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between xl:justify-end gap-6 border-t xl:border-t-0 xl:border-l border-slate-200 pt-4 xl:pt-0 xl:pl-6 flex-shrink-0">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Session Code
                          </span>
                          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm group-hover:border-indigo-200 transition-colors">
                            <Hash size={14} className="text-indigo-500" />
                            <span className="font-mono font-bold text-indigo-700 tracking-widest">
                              {session.sessionCode}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyCode(session.sessionCode);
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                              title="Copy Code"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </div>

                        {canEnter && (
                          <button
                            // 🎯 ĐÃ SỬA: Chuyển hướng xử lý click nút qua hàm bảo vệ workflow đồng bộ
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnterLiveRoom(session);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                          >
                            <LogIn size={13} /> ENTER ROOM
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

const ClassCard: React.FC<{
  item: ClassItem;
  onClick: () => void;
}> = ({ item, onClick }) => (
  <div
    onClick={onClick}
    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between h-[340px] relative hover:shadow-lg hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer"
  >
    <div>
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
          <BookOpen size={28} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
        >
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="text-[10px] font-bold text-blue-600 tracking-wider mb-1 uppercase">
        {item.code}
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 mb-3 leading-tight uppercase tracking-tight group-hover:text-blue-600 transition-colors line-clamp-2">
        {item.name}
      </h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm line-clamp-2">
        {item.description || "Chưa có mô tả chi tiết cho môn học này."}
      </p>
    </div>

    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
      <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 group-hover:bg-blue-50/50 transition-colors w-full">
        <Calendar size={14} className="text-blue-600" />
        <div className="text-[10px] font-bold text-slate-400 uppercase leading-tight">
          Created <br />{" "}
          <span className="text-slate-600">{formatDate(item.createdAt)}</span>
        </div>
      </div>
    </div>
  </div>
);

export default ManageClassesPage;
