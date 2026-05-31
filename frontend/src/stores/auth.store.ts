import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types/common/user.types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null; // <-- Lưu thêm để phục vụ luồng Auto-Refresh
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: "auth-storage", // Tên định danh của Key nằm dưới Application LocalStorage
    },
  ),
);
