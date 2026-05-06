import React, { useState } from "react";
import {
  Camera,
  RefreshCw,
  XCircle,
  Search,
  MoreVertical,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// Dữ liệu mẫu học sinh
const initialStudents = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  name: `Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
  status: Math.random() > 0.5 ? "Active" : "Inactive",
}));

export const RealtimeMonitorPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [students] = useState(initialStudents);

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      {/* Header Section */}
      <header className="mb-8 border-b pb-4 border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">EduMind Pro</h1>
            <p className="text-slate-600">Giám sát phiên kiểm tra trực tuyến</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost">Dashboard</Button>
            <Button variant="ghost">Reports</Button>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border border-indigo-200">
              GV
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Title & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-3xl font-extrabold text-teal-600 tracking-tight">
          GIÁM SÁT PHIÊN KIỂM TRA
        </h2>
        <div className="flex items-center gap-3">
          {/* Sử dụng variant success cho hành động tích cực [cite: 35] */}
          <Button
            variant="success"
            className="flex items-center gap-2 shadow-sm"
          >
            <Camera size={18} />
            Kích hoạt Camera
          </Button>
          {/* Sử dụng variant outline cho hành động phụ [cite: 30] */}
          <Button
            variant="outline"
            className="flex items-center gap-2 shadow-sm bg-white"
          >
            <RefreshCw size={18} />
            Cập nhật
          </Button>
          {/* Sử dụng variant danger cho hành động dừng/hủy [cite: 35] */}
          <Button
            variant="danger"
            className="flex items-center gap-2 shadow-sm bg-white"
          >
            <XCircle size={18} />
            Dừng Phiên
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <Input
            type="search"
            placeholder="Tìm kiếm học sinh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:ring-teal-500 border-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sử dụng size="icon" để nút vuông vắn  */}
          <Button
            variant="ghost"
            size="icon"
            className="text-teal-600 bg-teal-50"
          >
            <LayoutGrid size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <List size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400">
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {students
          .filter((student) =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          .map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:border-teal-200 transition-all hover:shadow-md"
            >
              <div className="p-4 flex items-center justify-between border-b border-slate-50">
                <h4 className="font-semibold text-slate-800 text-sm truncate pr-2">
                  {student.name}
                </h4>
                <div className="flex items-center gap-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      student.status === "Active"
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-slate-300"
                    }`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 p-0 text-slate-400"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </div>
              </div>
              <div className="p-4 aspect-[4/3] bg-slate-100 flex flex-col items-center justify-center text-slate-400 transition-colors group-hover:bg-slate-50">
                {student.status === "Active" ? (
                  <>
                    <Camera size={40} className="text-teal-500 mb-2" />
                    <span className="text-[10px] uppercase font-bold text-teal-600">
                      Live Stream
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-1 bg-slate-300 rounded-full mb-2" />
                    <p className="text-[10px] uppercase font-medium">
                      No Signal
                    </p>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default RealtimeMonitorPage;
