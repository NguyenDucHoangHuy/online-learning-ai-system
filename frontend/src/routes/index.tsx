import { createBrowserRouter } from "react-router-dom";
<<<<<<< HEAD

// Public pages
import HomePage from "../pages/public/LandingPage";
=======
import HomePage from "../pages/public/LandingPage"; // Cập nhật theo đường dẫn thực tế của bạn
>>>>>>> 0718d81c57047ab8acd1bef6c25c2edadd4badeb
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/common/NotFoundPage";

<<<<<<< HEAD
// Student pages
import MyLearningPage from "../pages/student/MyLearningPage";
import JoinClassPage from "../pages/student/JoinClassPage";

// Teacher pages
import SessionHistoryPage from "../pages/teacher/SessionHistoryPage";
import SessionReportPage from "../pages/teacher/SessionReportPage";
=======
// 1. Import 2 component phòng học vừa tạo
import StudyRoomPage from "../pages/student/StudyRoomPage";
import TeachingRoomPage from "../pages/teacher/TeachingRoomPage";
>>>>>>> 0718d81c57047ab8acd1bef6c25c2edadd4badeb

import { ROUTES } from "../constants";

const router = createBrowserRouter([
<<<<<<< HEAD
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
    path: "/student/my-learning",
    element: <MyLearningPage />,
  },
  {
    path: "/student",
    element: <JoinClassPage />,
  },

  // Teacher routes
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
=======
  { path: ROUTES.HOME, element: <HomePage /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },

  // 2. Thêm route cho phòng học của Sinh viên
  { path: ROUTES.STUDENT.ROOM, element: <StudyRoomPage /> },

  // 3. Thêm route cho phòng học của Giảng viên
  { path: ROUTES.TEACHER.SESSION, element: <TeachingRoomPage /> },

  { path: "*", element: <NotFoundPage /> },
>>>>>>> 0718d81c57047ab8acd1bef6c25c2edadd4badeb
]);

export default router;