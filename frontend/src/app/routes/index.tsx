import { Routes, Route } from "react-router-dom";
import { ROUTES } from "../../constants";
import { ProtectedRoute } from "./ProtectedRoute";

// Layouts
import AuthLayout from "../../layouts/AuthLayout";
import StudentLayout from "../../layouts/StudentLayout";
import TeacherLayout from "../../layouts/TeacherLayout";

// Pages
import LoginPage from "../../pages/auth/LoginPage";
import RegisterPage from "../../pages/auth/RegisterPage";
import JoinClassPage from "../../pages/student/JoinClassPage";
import MyLearningPage from "../../pages/student/MyLearningPage";
import StudyRoomPage from "../../pages/student/StudyRoomPage";
import WaitingRoomPage from "../../pages/student/WaitingRoomPage";
import DashboardPage from "../../pages/teacher/DashboardPage";
import ManageClassesPage from "../../pages/teacher/ManageClassesPage";
import CreateSessionPage from "../../pages/teacher/CreateSessionPage";
import TeachingRoomPage from "../../pages/teacher/TeachingRoomPage";
import SessionHistoryPage from "../../pages/teacher/SessionHistoryPage";
import SessionReportPage from "../../pages/teacher/SessionReportPage";
import HomePage from "../../pages/public/HomePage"; // <-- Thêm dòng này
import NotFoundPage from "../../pages/common/NotFoundPage";

export const AppRoutes = () => {
  return (
    <Routes>
      {/* ================= CHUỖI CỦA KHÁCH / AUTHENTICATION ================= */}
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* ================= CHUỖI DÀNH CHO HỌC SINH (STUDENT ONLY) ================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.STUDENT_JOIN} element={<JoinClassPage />} />
        <Route path={ROUTES.STUDENT.HISTORY} element={<MyLearningPage />} />
        <Route path={ROUTES.STUDENT.WAITING} element={<WaitingRoomPage />} />
        <Route path={ROUTES.STUDY_ROOM} element={<StudyRoomPage />} />
      </Route>

      {/* ================= CHUỖI DÀNH CHO GIÁO VIÊN (TEACHER ONLY) ================= */}
      <Route
        element={
          <ProtectedRoute allowedRoles={["TEACHER"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.TEACHER_DASHBOARD} element={<DashboardPage />} />
        <Route path={ROUTES.TEACHER_CLASSES} element={<ManageClassesPage />} />
        <Route
          path={ROUTES.TEACHER.CREATE_SESSION}
          element={<CreateSessionPage />}
        />
        <Route path={ROUTES.TEACHER.HISTORY} element={<SessionHistoryPage />} />
        <Route path={ROUTES.TEACHER.REPORT} element={<SessionReportPage />} />
        <Route path={ROUTES.TEACHER_SESSION} element={<TeachingRoomPage />} />
      </Route>

      {/* ================= ĐIỀU HƯỚNG MẶC ĐỊNH & BẪY LỖI ================= */}
      {/* Trang báo lỗi phân quyền trái phép */}
      <Route
        path={ROUTES.UNAUTHORIZED}
        element={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
            <div className="max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-blue-300">
                Unauthorized
              </p>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Bạn không có quyền truy cập vào tài nguyên này.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Hãy đăng nhập lại bằng đúng tài khoản hoặc quay về trang chủ để
                chọn luồng phù hợp.
              </p>
            </div>
          </div>
        }
      />

      {/* SỬA TẠI ĐÂY: Gõ URL gốc "/" thì hiển thị trực tiếp Landing Page của EduSense */}
      <Route path={ROUTES.HOME} element={<HomePage />} />

      {/* Bẫy tất cả các URL gõ bậy bạ ra màn hình 404 */}
      <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
