import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Check,
  Edit2,
  Trash2,
  AlertTriangle,
  X, // 👈 Thêm icon X để xóa nhanh từ khóa
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import CreateClassModal from "./CreateClassModal";
import { ROUTES } from "../../constants";
import { SESSION_STATUS } from "../../constants/session.constants";
import { formatDate, formatTime } from "../../utils/date";
import {
  useClasses,
  useDeleteClass,
} from "../../services/classes/classes.queries";
import { useClassSessions } from "../../services/sessions/sessions.queries";
import { ClassItem, SessionItem } from "../../types/api";

const ManageClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null); // 👈 Ref phục vụ tự động focus vào ô tìm kiếm
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // 🎯 STATE PHỤC VỤ CHỈNH SỬA LỚP HỌC
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // 🎯 STATE PHỤC VỤ HỘP THOẠI XÓA LỚP HỌC
  const [deletingClass, setDeletingClass] = useState<ClassItem | null>(null);

  // 🎯 STATE QUẢN LÝ DROPDOWN 3 CHẤM CỦA LỚP HỌC
  const [activeMenuClassId, setActiveMenuClassId] = useState<string | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 📡 Gọi API lấy danh sách lớp học
  const { data: classesResponse, isLoading: isClassesLoading } = useClasses();
  const classesList = classesResponse?.data || [];

  // 📡 Gọi API xóa lớp học xuống thẳng Database
  const { mutate: deleteClass, isPending: isDeletePending } = useDeleteClass();

  // 📡 Gọi API lấy danh sách buổi học
  const { data: sessionsResponse, isLoading: isSessionsLoading } =
    useClassSessions(selectedClass?.id || "");

  const sessionsList = sessionsResponse?.data || [];

  // 🔍 1. FUNCTION TÌM KIẾM AN TOÀN (Bổ sung kiểm tra ? chống crash nếu name/code bị null hoặc undefined)
  const filteredClasses = classesList.filter((item) => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    if (!cleanSearch) return true;

    const nameMatch = item?.name?.toLowerCase().includes(cleanSearch) || false;
    const codeMatch = item?.code?.toLowerCase().includes(cleanSearch) || false;

    return nameMatch || codeMatch;
  });

  // 🔍 2. CÁC FUNCTION KHI CLICK VÀO TRONG MENU DẤU 3 CHẤM
  const handleEditClass = (classItem: ClassItem) => {
    setActiveMenuClassId(null); // Đóng menu 3 chấm
    setEditingClass(classItem); // Lưu thông tin lớp cần sửa vào state
    setIsModalOpen(true); // Mở Modal
  };

  const handleDeleteClick = (classItem: ClassItem) => {
    setActiveMenuClassId(null); // Đóng menu 3 chấm
    setDeletingClass(classItem); // Kích hoạt mở hộp thoại xác nhận xóa custom
  };

  const handleConfirmDelete = () => {
    if (deletingClass) {
      // 📡 GỌI API XÓA XUỐNG DATABASE THẬT
      deleteClass(deletingClass.id, {
        onSuccess: () => {
          setDeletingClass(null); // Xóa thành công thì đóng hộp thoại và dọn dẹp state
        },
        onError: (err: unknown) => {
          console.error("Lỗi khi xóa lớp học:", err);
          alert("Không thể xóa lớp học vào lúc này. Vui lòng thử lại!");
        },
      });
    }
  };

  // Sao chép mã phòng bất đồng bộ
  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Không thể sao chép mã phòng:", err);
    }
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
                onClick={() => {
                  setEditingClass(null); // Đảm bảo clear dữ liệu cũ để ở trạng thái THÊM MỚI
                  setIsModalOpen(true);
                }}
                className="bg-slate-900 text-white rounded-full px-6 py-2.5 text-[11px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md shadow-slate-200"
              >
                <PlusCircle size={16} /> CREATE DISCIPLINE
              </Button>

              <div className="flex gap-2">
                {/* Nút kính lúp góc phải: Click vào tự động focus xuống ô tìm kiếm */}
                <button
                  onClick={() => searchInputRef.current?.focus()}
                  className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                >
                  <Search size={18} />
                </button>
                <button className="p-2.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-blue-600 transition-all shadow-sm relative">
                  <Bell size={18} />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                </button>
              </div>
            </div>
          </header>

          {/* Ô INPUT TÌM KIẾM CẢI TIẾN */}
          <div className="relative mb-12 max-w-xl group">
            <Search
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={20}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by subject name or class code..."
              className="w-full pl-14 pr-12 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 placeholder:text-slate-400 font-medium transition-all"
            />
            {/* Nút Xóa nhanh từ khóa vừa nhập */}
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            )}
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
                  isMenuOpen={activeMenuClassId === item.id}
                  onToggleMenu={(e) => {
                    e.stopPropagation();
                    setActiveMenuClassId(
                      activeMenuClassId === item.id ? null : item.id,
                    );
                  }}
                  onCloseMenu={() => setActiveMenuClassId(null)}
                  onEdit={() => handleEditClass(item)}
                  onDelete={() => handleDeleteClick(item)}
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
                {sessionsList.map((session: SessionItem) => (
                  <div
                    key={session.id}
                    onClick={() => {
                      if (session.status === SESSION_STATUS.ACTIVE) {
                        navigate(`/teacher/session/${session.id}`);
                      }
                    }}
                    className={`group flex flex-col xl:flex-row xl:items-center justify-between p-6 bg-slate-50 hover:bg-blue-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-all gap-4 ${
                      session.status === SESSION_STATUS.ACTIVE
                        ? "cursor-pointer ring-1 ring-emerald-500/20 shadow-sm"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-colors ${
                          session.status === SESSION_STATUS.ACTIVE
                            ? "bg-emerald-500 text-white animate-pulse"
                            : session.status === SESSION_STATUS.WAITING
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        <Video size={20} />
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors">
                          {session.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 mt-1">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} />{" "}
                            {formatDate(session.createdAt)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock size={14} /> {formatTime(session.startedAt)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest ${
                              session.status === SESSION_STATUS.ACTIVE
                                ? "bg-emerald-100 text-emerald-700"
                                : session.status === SESSION_STATUS.WAITING
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 border-t xl:border-t-0 xl:border-l border-slate-200 pt-4 xl:pt-0 xl:pl-6">
                      <div
                        className="flex flex-col gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Session Code
                        </span>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm group-hover:border-indigo-200 transition-colors">
                          <Hash size={14} className="text-indigo-500" />
                          <span className="font-mono font-bold text-indigo-700 tracking-widest">
                            {session.sessionCode}
                          </span>
                          <button
                            onClick={() =>
                              handleCopyCode(session.id, session.sessionCode)
                            }
                            className={`transition-colors p-1 rounded ${
                              copiedId === session.id
                                ? "text-emerald-500"
                                : "text-slate-400 hover:text-indigo-600"
                            }`}
                            title="Copy Code"
                          >
                            {copiedId === session.id ? (
                              <Check size={14} />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🛠 MODAL CHỨC NĂNG THÊM MỚI / CHỈNH SỬA (Dùng chung một Modal) */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClass(null); // Reset trạng thái chỉnh sửa khi đóng modal
        }}
        editData={editingClass} // Truyền dữ liệu chỉnh sửa (nếu có) vào Modal con
      />

      {/* 🗑 HỘP THOẠI XÁC NHẬN XÓA (CUSTOM MODAL) */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl flex-shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                  Xóa lớp học?
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  Bạn có chắc chắn muốn xóa lớp học{" "}
                  <strong className="text-slate-800 font-bold">
                    {deletingClass.name} ({deletingClass.code})
                  </strong>
                  ? Hành động này không thể hoàn tác và toàn bộ dữ liệu liên
                  quan sẽ bị mất.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-50">
              <button
                onClick={() => setDeletingClass(null)}
                disabled={isDeletePending}
                className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeletePending}
                className="px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/10 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletePending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Xóa...
                  </>
                ) : (
                  "Xác nhận xóa"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENT CON THUẦN TÚY: ClassCard ---
const ClassCard: React.FC<{
  item: ClassItem;
  onClick: () => void;
  isMenuOpen: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({
  item,
  onClick,
  isMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onEdit,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onCloseMenu();
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen, onCloseMenu]);

  return (
    <div
      onClick={onClick}
      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col justify-between h-[340px] relative hover:shadow-lg hover:border-blue-200 hover:-translate-y-1.5 transition-all duration-300 group cursor-pointer"
    >
      <div>
        <div className="flex justify-between items-start mb-8">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
            <BookOpen size={28} />
          </div>

          {/* NÚT 3 CHẤM ACTION MENU */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={onToggleMenu}
              className={`p-2 rounded-xl transition-colors ${
                isMenuOpen
                  ? "text-slate-800 bg-slate-100"
                  : "text-slate-300 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MoreVertical size={24} />
            </button>

            {/* DROPDOWN MENU KHI CLICK DẤU 3 CHẤM */}
            {isMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={onEdit}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 size={16} className="text-slate-400" />
                  Chỉnh sửa lớp
                </button>
                <hr className="border-slate-100 my-1" />
                <button
                  onClick={onDelete}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
                >
                  <Trash2 size={16} className="text-rose-500" />
                  Xóa lớp học
                </button>
              </div>
            )}
          </div>
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
};

export default ManageClassesPage;
