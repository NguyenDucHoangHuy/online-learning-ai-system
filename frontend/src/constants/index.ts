export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  STUDENT: {
    JOIN: "/student",
    ROOM: "/student/room/:sessionId",
    HISTORY: "/student/my-learning",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    CLASSES: "/teacher/manage-classes", // Khai báo chuẩn ở đây
    CREATE_SESSION: "/teacher/create-session",
    SESSION: "/teacher/session/:sessionId",
    HISTORY: "/teacher/session-history",
    REPORT: "/teacher/session-report",
  },
} as const;

export const ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
} as const;

export const EMOTION_LABEL: Record<string, string> = {
  happy: "Vui vẻ",
  neutral: "Bình thường",
  sad: "Buồn",
  tired: "Mệt mỏi",
  sleepy: "Buồn ngủ",
  angry: "Tức giận",
};

export const ATTENTION_THRESHOLD = {
  HIGH: 70,
  MEDIUM: 50,
} as const;
