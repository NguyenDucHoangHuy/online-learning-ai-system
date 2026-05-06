// src/routes/index.tsx
import { createBrowserRouter } from "react-router-dom";

// Public pages
import HomePage from "../pages/public/LandingPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/common/NotFoundPage";

// Student pages
import MyLearningPage from "../pages/student/MyLearningPage";
import JoinClassPage from "../pages/student/JoinClassPage";
import StudyRoomPage from "../pages/student/StudyRoomPage";

// Teacher pages
import DashboardPage from "../pages/teacher/DashboardPage";
import TeachingRoomPage from "../pages/teacher/TeachingRoomPage";
import CreateSessionPage from "../pages/teacher/CreateSessionPage";
import ManageClassesPage from "../pages/teacher/ManageClassesPage";
import SessionHistoryPage from "../pages/teacher/SessionHistoryPage";
import SessionReportPage from "../pages/teacher/SessionReportPage";

import { ROUTES } from "../constants";

const router = createBrowserRouter([
  // ================= PUBLIC =================
  {
    path: ROUTES.HOME,
    element: <HomePage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },

  // ================= STUDENT =================
  {
    path: ROUTES.STUDENT.JOIN,
    element: <JoinClassPage />,
  },
  {
    path: ROUTES.STUDENT.ROOM,
    element: <StudyRoomPage />,
  },
  {
    path: ROUTES.STUDENT.HISTORY,
    element: <MyLearningPage />,
  },

  // ================= TEACHER =================
  {
    path: ROUTES.TEACHER.DASHBOARD,
    element: <DashboardPage />,
  },
  {
    path: ROUTES.TEACHER.CLASSES,
    element: <ManageClassesPage />,
  },
  {
    path: ROUTES.TEACHER.CREATE_SESSION,
    element: <CreateSessionPage />,
  },
  {
    path: ROUTES.TEACHER.SESSION,
    element: <TeachingRoomPage />,
  },
  {
    path: ROUTES.TEACHER.HISTORY,
    element: <SessionHistoryPage />,
  },
  {
    path: ROUTES.TEACHER.REPORT,
    element: <SessionReportPage />,
  },

  // ================= 404 =================
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
