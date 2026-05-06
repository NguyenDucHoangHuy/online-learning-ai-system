import { useState } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { X, Upload, Globe, User, Folder, Book } from "lucide-react";

interface ClassesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const ClassesPage = ({ isOpen, onClose }: ClassesPageProps) => {
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("book");

  if (!isOpen) return null;

  const handleCreateClass = () => {
    console.log({
      className,
      classDescription,
      tags,
      avatar: selectedAvatar,
      instructor: "Teacher - Alex J.",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      {/* 
        Container Modal: 
        - Thêm style inline để ẩn thanh cuộn trên Firefox và IE.
        - Thêm thẻ <style> để ẩn trên Chrome/Safari.
      */}
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* IE and Edge */,
        }}
      >
        {/* CSS ẩn thanh cuộn cho Webkit (Chrome, Safari, Brave) */}
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-50 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Create New Class
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Set up your virtual classroom with AI sentiment integration
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
          <p className="text-right text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
            * Indicates required field
          </p>

          {/* Instructor Info */}
          <div className="bg-slate-50 p-4 rounded-2xl mb-6 text-sm text-slate-600 border border-slate-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span>
              <strong>Instructor:</strong> Teacher - Alex J.
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
                className="rounded-xl border-slate-200 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-2 ml-1">
                Choose a clear, descriptive name for your students.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Class Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                placeholder="Provide a detailed overview of the class, key topics, and prerequisites."
                value={classDescription}
                onChange={(e) => setClassDescription(e.target.value)}
                maxLength={500}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-sm font-medium transition-all h-32 resize-none"
              />
              <div className="flex justify-end text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tight">
                {classDescription.length} / 500 characters
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-slate-50 pt-6">
              <details className="group">
                <summary className="flex items-center font-bold text-xs text-slate-500 uppercase tracking-[0.15em] cursor-pointer list-none hover:text-indigo-600 transition-colors">
                  <span className="mr-2 transition-transform group-open:rotate-90">
                    ▶
                  </span>
                  Advanced Class Settings (Optional)
                </summary>

                <div className="mt-6 space-y-6 pl-2">
                  <Input
                    id="classTags"
                    label="Tags / Subject"
                    placeholder="e.g., AI, Deep Learning, Mathematics"
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
                              ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm"
                              : "border-slate-100 text-slate-400 hover:bg-slate-50"
                          }`}
                        >
                          {item.icon}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="px-5 py-2 border border-dashed border-slate-200 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-slate-50 flex items-center gap-2 transition-all"
                      >
                        <Upload size={14} /> UPLOAD IMAGE
                      </button>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-10 flex justify-between items-center gap-6">
            <div className="flex gap-3 flex-1">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 rounded-2xl py-6 font-bold text-slate-500 border-slate-100 hover:bg-slate-50"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleCreateClass}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-indigo-100 transition-all"
              >
                CREATE CLASS
              </Button>
            </div>
            <div className="hidden sm:block text-[9px] text-slate-400 text-right leading-tight max-w-[140px] font-medium">
              <p className="font-black text-rose-400 uppercase mb-1">
                Admin Alert
              </p>
              Approved class limit: 15 active classes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassesPage;
