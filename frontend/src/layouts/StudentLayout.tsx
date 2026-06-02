import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/SidebarStudent";

export default function StudentLayout() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="min-w-0 flex-1 p-0 md:ml-[270px] md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
