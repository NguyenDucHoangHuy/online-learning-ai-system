import { Outlet } from "react-router-dom";
import SidebarTeacher from "../components/layout/SidebarTeacher";

export default function TeacherLayout() {
  return (
    <div className="flex">
      <SidebarTeacher />

      <main className="flex-1 ml-[270px] p-6">
        <Outlet /> {/* 👈 chỗ này render page con */}
      </main>
    </div>
  );
}
