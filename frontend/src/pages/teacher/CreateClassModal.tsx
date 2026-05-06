// src/pages/teacher/CreateClassModal.tsx
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { X, Globe, User, Folder, Book } from "lucide-react";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateClassModal = ({ isOpen, onClose }: CreateClassModalProps) => {
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("book");

  if (!isOpen) return null;

  const handleCreateClass = () => {
    console.log("Class Created:", {
      className,
      classDescription,
      tags,
      avatar: selectedAvatar,
      instructor: "Hoàng Huy",
    });
    alert("Discipline Created Successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300 relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* CSS ẩn thanh cuộn cho Webkit (Chrome, Safari, Brave) */}
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-50 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create New Discipline
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Set up your virtual classroom portfolio
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {/* Instructor Info */}
          <div className="bg-blue-50/50 p-4 rounded-2xl mb-6 text-sm text-blue-800 border border-blue-100 flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>
              <strong>Instructor:</strong> Hoàng Huy
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <Input
                id="className"
                label="Class Name"
                required
                placeholder="e.g., 'Neural Networks 401'"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="rounded-xl border-slate-200 focus:ring-blue-500"
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
                onChange={(e) => setClassDescription(e.target.value)}
                maxLength={500}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all h-32 resize-none"
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
                          onClick={() => setSelectedAvatar(item.id)}
                          className={`p-4 border rounded-2xl transition-all ${
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
          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex gap-3 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-2xl py-6 font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleCreateClass}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-blue-600/20"
            >
              CREATE DISCIPLINE
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClassModal;
