// src/types/api/auth.types.ts
import { User } from "../common/user.types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: "STUDENT" | "TEACHER";
  teacherCode?: string; // <-- Đảm bảo có dòng này để truyền mã sang Backend
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
