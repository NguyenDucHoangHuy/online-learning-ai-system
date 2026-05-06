import { createBrowserRouter } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/teacher/DashboardPage";
import { RealtimeMonitorPage } from "../pages/teacher/RealtimeMonitorPage";
// 1. Thêm dòng import này
import CreateSessionPage from "../pages/teacher/CreateSessionPage";
import ManageClassesPage from "../pages/teacher/ManageClassesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/teacher/dashboard", // Nên có path rõ ràng cho Dashboard
    element: <DashboardPage />,
  },
  {
    path: "/teacher/realtime-monitor",
    element: <RealtimeMonitorPage />,
  },
  // 2. ĐĂNG KÝ PATH NÀY ĐỂ HẾT LỖI 404
  {
    path: "/teacher/create-session",
    element: <CreateSessionPage />,
  },
  {
    path: "/teacher/manage-classes",
    element: <ManageClassesPage />,
  },
]);
