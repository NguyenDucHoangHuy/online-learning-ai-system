import { create } from "zustand";

interface AuthState {
  user: any;
  setUser: (user: any) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
