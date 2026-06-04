import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types/common/user.types";

export const AUTH_STORAGE_KEY = "auth-storage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  logoutLocal: () => void;
}

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.clear();
};

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

      logoutLocal: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
        clearStoredAuth();
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
    },
  ),
);
