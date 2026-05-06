// src/pages/teacher/ClassesPage.tsx (hoặc CreateSessionPage.tsx tùy bạn đặt tên)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Upload, Globe, User, Folder, Book, ArrowLeft } from "lucide-react";
import SidebarTeacher from "../../components/layout/SidebarTeacher"; // Import Sidebar

const ClassesPage = () => {
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("book");

  const handleCreateClass = () => {
    console.log({
      className,
      classDescription,
      tags,
      avatar: selectedAvatar,
      instructor: "Hoàng Huy", // Đổi tên thành bạn cho ngầu
    });
    // Xử lý logic xong thì chuyển hướng về trang quản lý lớp
    navigate("/teacher/manage-classes");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* 1. Gắn Sidebar vào đây */}
      <SidebarTeacher activeItem="Create Session" />

      {/* 2. Nội dung chính: Có ml-[270px] để né Sidebar */}
      <main className="flex-1 ml-[270px] p-8 md:p-12 lg:p-16 overflow-y-auto">
        {/* Container giống như form đăng ký */}
        <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          {/* Header của Form */}
          <div className="flex items-center gap-4 p-8 border-b border-slate-50 bg-white">
            <button
              onClick={() => navigate(-1)}
              className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-colors border border-slate-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Create New Class
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Set up your virtual classroom with AI sentiment integration
              </p>
            </div>
          </div>

          <div className="p-8">
            <p className="text-right text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
              * Indicates required field
            </p>

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
                                ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm"
                                : "border-slate-200 text-slate-400 hover:bg-slate-50"
                            }`}
                          >
                            {item.icon}
                          </button>
                        ))}
                        <button
                          type="button"
                          className="px-5 py-2 border border-dashed border-slate-300 rounded-2xl text-[10px] font-bold text-slate-400 hover:bg-slate-50 hover:border-slate-400 flex items-center gap-2 transition-all"
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
            <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-100">
              <div className="flex gap-3 w-full sm:w-auto flex-1">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 rounded-2xl py-6 font-bold text-slate-500 border-slate-200 hover:bg-slate-50"
                >
                  CANCEL
                </Button>
                <Button
                  onClick={handleCreateClass}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-6 font-bold shadow-lg shadow-blue-600/20 transition-all"
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
      </main>
    </div>
  );
};

export default ClassesPage;
