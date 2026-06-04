import { Outlet, useNavigate } from "react-router-dom";
import SidebarTeacher from "../components/layout/SidebarTeacher";
import { ROUTES } from "../constants";
import { authService } from "../services/auth/auth.service";
import { useAuthStore } from "../stores/auth.store";

export default function TeacherLayout() {
  const navigate = useNavigate();
  const logoutLocal = useAuthStore((state) => state.logoutLocal);

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout request failed, clearing local session anyway:", error);
    } finally {
      logoutLocal();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <div className="flex">
      <SidebarTeacher onSignOut={handleSignOut} />

      <main className="flex-1 ml-[270px] p-6">
        <Outlet /> {/* 👈 chỗ này render page con */}
      </main>
    </div>
  );
}
