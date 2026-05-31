export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  UNAUTHORIZED: "/unauthorized",

  // Phân hệ dành cho Học sinh (Student)
  STUDENT_JOIN: "/join",
  STUDY_ROOM: "/study-room/:sessionId",

  // Phân hệ dành cho Giáo viên (Teacher)
  TEACHER_DASHBOARD: "/teacher/dashboard",
  TEACHER_CLASSES: "/teacher/classes",
  TEACHER_CLASS_DETAIL: "/teacher/classes/:classId", // <-- Bổ sung: Xem chi tiết lớp để tạo Session
  TEACHER_SESSION: "/teacher/session/:sessionId",

  // Phân hệ bẫy lỗi hệ thống
  NOT_FOUND: "*",
} as const;

/**
 * Route Helpers: Trạm trung chuyển tạo URL động tập trung.
 * Giúp Frontend truyền tham số (Id) vào URL an toàn, chống hoàn toàn lỗi Typo chuỗi.
 * * Cách xài tại Component: navigate(getDynamicRoute.studyRoom(session.id));
 */
export const getDynamicRoute = {
  studyRoom: (sessionId: string) => `/study-room/${sessionId}`,
  teacherClassDetail: (classId: string) => `/teacher/classes/${classId}`,
  teacherSession: (sessionId: string) => `/teacher/session/${sessionId}`,
} as const;
