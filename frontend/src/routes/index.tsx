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
import TeachingRoomPage from "../pages/teacher/TeachingRoomPage";
import SessionHistoryPage from "../pages/teacher/SessionHistoryPage";
import SessionReportPage from "../pages/teacher/SessionReportPage";

import { ROUTES } from "../constants";

const router = createBrowserRouter([
  // Public routes
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

  // Student routes
  {
    path: ROUTES.STUDENT.ROOM,
    element: <StudyRoomPage />,
  },
  {
    path: "/student/my-learning",
    element: <MyLearningPage />,
  },
  {
    path: "/student",
    element: <JoinClassPage />,
  },

  // Teacher routes
  {
    path: ROUTES.TEACHER.SESSION,
    element: <TeachingRoomPage />,
  },
  {
    path: "/teacher/session-history",
    element: <SessionHistoryPage />,
  },
  {
    path: "/teacher/session-report",
    element: <SessionReportPage />,
  },

  // Not found
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default router;
