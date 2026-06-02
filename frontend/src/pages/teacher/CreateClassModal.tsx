// src/pages/teacher/CreateClassModal.tsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { X, Globe, User, Folder, Book, Loader2 } from "lucide-react";
import { useCreateClass } from "../../services/classes/classes.queries";
import { useAuthStore } from "../../stores/auth.store"; // 🎯 NẠP AUTH STORE ĐỂ DỌN HARD-CODE

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateClassModal = ({ isOpen, onClose }: CreateClassModalProps) => {
  // 👥 Trích xuất danh tính động của Giảng viên đang thao tác hệ thống
  const user = useAuthStore((s) => s.user);

  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("book");
  const [error, setError] = useState("");

  // 📡 KẾT NỐI API: Gọi mutation tạo lớp học từ TanStack Query
  const { mutate: createClass, isPending } = useCreateClass();

  // Khóa chặn vị trí đặt điều kiện return để không vi phạm luật Rules of Hooks
  if (!isOpen) return null;

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Vui lòng nhập tên môn học / lớp học");
      return;
    }

    if (!classDescription.trim()) {
      setError("Vui lòng nhập mô tả chi tiết cho môn học này");
      return;
    }

    // 📡 Kích nổ API đẩy dữ liệu xuống Database
    createClass(
      {
        name: className.trim(),
        description: classDescription.trim(),
        // Bồ có thể bổ sung thêm trường tags hoặc avatar xuống payload nếu API backend mở rộng hỗ trợ sau này
      },
      {
        onSuccess: () => {
          // Làm sạch form hoàn toàn trước khi rút lui đóng màn hình ẩn
          setClassName("");
          setClassDescription("");
          setTags("");
          setSelectedAvatar("book");
          onClose();
        },
        onError: (err: unknown) => {
          setError(
            err instanceof Error
              ? err.message
              : "Đã có lỗi xảy ra khi tạo lớp học.",
          );
        },
      },
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Màn che mờ đóng modal khi click ra ngoài (Chặn click nếu đang gửi data ngầm) */}
      <div
        className="absolute inset-0"
        onClick={() => !isPending && onClose()}
      />

      {/* Modal Container */}
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300 relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create New Discipline
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Set up your virtual classroom portfolio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {/* Instructor Info — 🎯 FIX CHỐT LUỒNG: Đồng bộ danh tính động chuẩn xác */}
          <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 text-sm text-blue-800 border border-blue-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>
              <strong>Instructor:</strong>{" "}
              {user?.fullName || "Giảng viên chủ phòng"}
            </span>
          </div>

          {/* Khung báo lỗi từ Server */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateClass} className="space-y-6">
            <div>
              <Input
                id="className"
                label="Class Name"
                required
                disabled={isPending}
                placeholder="e.g., 'Neural Networks 401'"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="rounded-xl border-slate-200 focus:ring-blue-500 font-bold text-slate-800 disabled:opacity-50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Class Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Provide a detailed overview of the class..."
                value={classDescription}
                disabled={isPending}
                onChange={(e) => setClassDescription(e.target.value)}
                maxLength={500}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all h-32 resize-none disabled:opacity-50"
              />
              <div className="flex justify-end text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                {classDescription.length} / 500 characters
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-slate-100 pt-6">
              <details className="group">
                <summary className="flex items-center font-bold text-xs text-slate-500 uppercase tracking-[0.15em] cursor-pointer list-none hover:text-blue-600 transition-colors">
                  <span className="mr-2 transition-transform group-open:rotate-90">
                    ▶
                  </span>
                  Advanced Class Settings (Optional)
                </summary>

                <div className="mt-6 space-y-6 pl-2">
                  <Input
                    id="classTags"
                    label="Tags / Subject"
                    disabled={isPending}
                    placeholder="e.g., AI, Deep Learning"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">
                      Class Avatar
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: "globe", icon: <Globe size={18} /> },
                        { id: "user", icon: <User size={18} /> },
                        { id: "folder", icon: <Folder size={18} /> },
                        { id: "book", icon: <Book size={18} /> },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          disabled={isPending}
                          onClick={() => setSelectedAvatar(item.id)}
                          className={`p-4 border rounded-2xl transition-all disabled:opacity-50 ${
                            selectedAvatar === item.id
                              ? "border-blue-600 bg-blue-50 text-blue-600"
                              : "border-slate-200 text-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {item.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* Footer Actions */}
            <div className="mt-10 flex gap-3 pt-6 border-t border-slate-100">
              <Button
                variant="outline"
                type="button"
                disabled={isPending}
                onClick={onClose}
                className="flex-1 rounded-2xl py-6 font-bold text-slate-500 border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                CANCEL
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> WRITING
                    DATA...
                  </>
                ) : (
                  "CREATE DISCIPLINE"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CreateClassModal;
