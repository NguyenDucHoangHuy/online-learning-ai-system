import { createBrowserRouter } from "react-router-dom";
import HomePage from "../pages/public/LandingPage"; // Cập nhật theo đường dẫn thực tế của bạn
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/common/NotFoundPage";

// 1. Import 2 component phòng học vừa tạo
import StudyRoomPage from "../pages/student/StudyRoomPage";
import TeachingRoomPage from "../pages/teacher/TeachingRoomPage";

import { ROUTES } from "../constants";

const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <HomePage /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },

  // 2. Thêm route cho phòng học của Sinh viên
  { path: ROUTES.STUDENT.ROOM, element: <StudyRoomPage /> },

  // 3. Thêm route cho phòng học của Giảng viên
  { path: ROUTES.TEACHER.SESSION, element: <TeachingRoomPage /> },

  { path: "*", element: <NotFoundPage /> },
]);

export default router;
