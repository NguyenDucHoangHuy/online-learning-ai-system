import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Loader2, X } from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useUpdateClass } from "../../services/classes/classes.queries";
import type { ClassItem } from "../../types/api";

interface EditClassModalProps {
  classItem: ClassItem | null;
  onClose: () => void;
}

export default function EditClassModal({
  classItem,
  onClose,
}: EditClassModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const { mutate: updateClass, isPending } = useUpdateClass();

  useEffect(() => {
    if (!classItem) return;
    setName(classItem.name);
    setDescription(classItem.description ?? "");
    setError("");
  }, [classItem]);

  if (!classItem) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên lớp học.");
      return;
    }

    updateClass(
      {
        classId: classItem.id,
        payload: { name: name.trim(), description: description.trim() },
      },
      {
        onSuccess: onClose,
        onError: (updateError) =>
          setError(
            updateError instanceof Error
              ? updateError.message
              : "Không thể cập nhật lớp học.",
          ),
      },
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0"
        onClick={() => !isPending && onClose()}
        aria-label="Đóng"
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-xl rounded-[2rem] bg-white p-8 shadow-2xl"
      >
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Chỉnh sửa lớp học
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Cập nhật tên và mô tả của lớp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <Input
            id="editClassName"
            label="Tên lớp học"
            value={name}
            disabled={isPending}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
              Mô tả
            </label>
            <textarea
              value={description}
              disabled={isPending}
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3 border-t border-slate-100 pt-6">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
            className="flex-1 rounded-xl"
          >
            HỦY
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {isPending ? <Loader2 className="animate-spin" size={17} /> : "LƯU"}
          </Button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
