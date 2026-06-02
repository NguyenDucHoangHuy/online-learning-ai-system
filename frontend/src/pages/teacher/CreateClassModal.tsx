import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { X, Globe, User, Folder, Book, Loader2 } from "lucide-react";
import {
  useCreateClass,
  useUpdateClass,
} from "../../services/classes/classes.queries";
// 🎯 IMPORT STORE ĐỂ LẤY THÔNG TIN GIẢNG VIÊN REALTIME
import { useAuthStore } from "../../stores/auth.store";
// 🎯 IMPORT CÁC TYPES CHUẨN ĐÃ ĐỊNH NGHĨA
import { ClassItem, CreateClassPayload } from "../../types/api/class.types";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: ClassItem | null; // 👈 Thêm prop nhận dữ liệu chỉnh sửa lớp học từ trang cha
}

const CreateClassModal = ({
  isOpen,
  onClose,
  editData,
}: CreateClassModalProps) => {
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("book");
  const [error, setError] = useState("");

  // 👤 LẤY USER THỰC TẾ ĐỂ KHỬ CỨNG TÊN "HOÀNG HUY"
  const user = useAuthStore((state) => state.user);

  // 📡 KẾT NỐI API: Gọi mutation tạo lớp học
  const { mutate: createClass, isPending: isCreatePending } = useCreateClass();

  // 📡 1. KÍCH HOẠT HOOK UPDATE CHÍNH THỨC Ở ĐÂY:
  const { mutate: updateClass, isPending: isUpdatePending } = useUpdateClass();

  // 🔄 2. ĐỒNG BỘ TRẠNG THÁI LOADING CHO CẢ TẠO VÀ SỬA:
  const isPending = isCreatePending || isUpdatePending;

  // 🔄 THEO DÕI TRẠNG THÁI MỞ MODAL ĐỂ ĐỔ DỮ LIỆU HOẶC LÀM TRỐNG FORM
  useEffect(() => {
    if (isOpen) {
      setError("");
      if (editData) {
        // Nếu có dữ liệu editData => Chuyển sang chế độ CHỈNH SỬA
        setClassName(editData.name || "");
        setClassDescription(editData.description || "");
        // Các trường mở rộng tạm thời reset hoặc map tương ứng nếu hệ thống lưu trữ
        setTags("");
        setSelectedAvatar("book");
      } else {
        // Nếu không có editData => Chuyển sang chế độ TẠO MỚI hoàn toàn
        setClassName("");
        setClassDescription("");
        setTags("");
        setSelectedAvatar("book");
      }
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!className.trim()) {
      setError("Vui lòng nhập tên môn học / lớp học");
      return;
    }

    if (!classDescription.trim()) {
      setError("Vui lòng nhập mô tả chi tiết cho môn học");
      return;
    }

    // 📡 Thiết lập Payload chuẩn hóa theo đúng cấu trúc CreateClassPayload
    const payload: CreateClassPayload = {
      name: className.trim(),
      description: classDescription.trim() || undefined,
    };

    const mutationOptions = {
      onSuccess: () => {
        // Làm sạch form hoàn toàn trước khi rút lui
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
            : "Đã có lỗi xảy ra. Vui lòng thử lại.",
        );
      },
    };

    if (editData) {
      // 📡 KÍCH NỔ API CẬP NHẬT (UPDATE) LỚP HỌC THẬT VÀO DB
      console.log("Kích hoạt API Update lớp học có ID:", editData.id, payload);

      updateClass(
        {
          id: editData.id,
          payload: payload,
        },
        mutationOptions,
      );
    } else {
      // 📡 KÍCH NỔ API TẠO MỚI (CREATE) LỚP HỌC
      createClass(payload, mutationOptions);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Màn che mờ đóng modal khi click ra ngoài */}
      <div
        className="absolute inset-0"
        onClick={() => !isPending && onClose()}
      />

      {/* Modal Container */}
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 relative z-10"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-50 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {editData ? "Edit Discipline" : "Create New Discipline"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {editData
                ? "Update your current classroom portfolio"
                : "Set up your virtual classroom portfolio"}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {/* Instructor Info */}
          <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 text-sm text-blue-800 border border-blue-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>
              <strong>Instructor:</strong>{" "}
              {user?.fullName || "Giảng viên Hệ thống"}
            </span>
          </div>

          {/* Khung báo lỗi từ Server */}
          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* THÔNG TIN KHÓA MÃ LỚP CỐ ĐỊNH CHỈ XUẤT HIỆN KHI CHỈNH SỬA */}
            {editData && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Class Code (Mã lớp học cố định)
                </label>
                <input
                  type="text"
                  value={editData.code}
                  disabled
                  className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-wider text-slate-400 cursor-not-allowed"
                />
              </div>
            )}

            {/* Class Name */}
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
                    <Loader2 size={16} className="animate-spin" /> SAVING...
                  </>
                ) : editData ? (
                  "SAVE CHANGES"
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
