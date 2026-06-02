import { io } from "socket.io-client";
import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,

  transports: ["websocket", "polling"],

  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const currentRefreshToken = useAuthStore.getState().refreshToken;

    if (!currentRefreshToken) {
      useAuthStore.getState().clearAuth();
      return null;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: currentRefreshToken,
      });

      if (!response.data?.success) {
        throw new Error("Refresh token rejected");
      }

      const { user, accessToken, refreshToken } = response.data.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      return accessToken as string;
    } catch (error) {
      console.error("Socket token refresh failed:", error);
      useAuthStore.getState().clearAuth();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

socket.on("connect_error", async (error) => {
  if (error.message !== "Token expired") return;

  const accessToken = await refreshAccessToken();
  if (!accessToken) {
    window.location.href = "/login";
    return;
  }

  socket.auth = { token: accessToken };
  socket.connect();
});

export const connectSocket = () => {
  const token = useAuthStore.getState().accessToken;

  if (!token) {
    return socket;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export const refreshSocketAuth = () => {
  const token = useAuthStore.getState().accessToken;
  socket.auth = token ? { token } : {};
};
