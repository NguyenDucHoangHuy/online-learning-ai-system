export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  STUDENT: {
    JOIN: "/student/join",
    ROOM: "/student/room/:sessionId",
    HISTORY: "/student/history",
  },
  TEACHER: {
    DASHBOARD: "/teacher/dashboard",
    CLASSES: "/teacher/classes",
    SESSION: "/teacher/session/:sessionId",
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
