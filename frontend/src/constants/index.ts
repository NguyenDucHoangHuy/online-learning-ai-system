import { ROUTES as FLAT_ROUTES, getDynamicRoute } from "./routes.constants";

export const ROUTES = {
  ...FLAT_ROUTES,
  STUDENT: {
    JOIN: FLAT_ROUTES.STUDENT_JOIN,
    HISTORY: "/student/history",
    ROOM: FLAT_ROUTES.STUDY_ROOM,
    WAITING: "/student/waiting",
  },
  TEACHER: {
    DASHBOARD: FLAT_ROUTES.TEACHER_DASHBOARD,
    CLASSES: FLAT_ROUTES.TEACHER_CLASSES,
    CLASS_DETAIL: FLAT_ROUTES.TEACHER_CLASS_DETAIL,
    CREATE_SESSION: "/teacher/create-session",
    SESSION: FLAT_ROUTES.TEACHER_SESSION,
    HISTORY: "/teacher/history",
    REPORT: FLAT_ROUTES.TEACHER_REPORT, // <--- 🎯 SỬA DÒNG NÀY: Dùng FLAT_ROUTES.TEACHER_REPORT thay vì chuỗi tĩnh bồ nha!
  },
} as const;

export { getDynamicRoute };
export * from "./events.constants";
export * from "./query-keys.constants";
export * from "./roles.constants";
export * from "./storage.constants";
export * from "./session.constants";
