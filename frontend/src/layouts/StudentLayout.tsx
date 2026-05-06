import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/SidebarStudent";

export default function StudentLayout() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 ml-[270px] p-6">
        <Outlet />
      </main>
    </div>
  );
}
