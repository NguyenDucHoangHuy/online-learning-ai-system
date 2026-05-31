import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// 1. Request Interceptor: Luôn bốc dữ liệu mới nhất từ Zustand State ra đóng dấu Authorization
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Response Interceptor: Xử lý giải nén dữ liệu sạch & Tự động xử lý bẫy lỗi 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // 🎯 CHỐT CHẶN BẪY LỖI 401: Nếu gặp lỗi hết hạn mã và request này chưa từng được thử lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Đánh dấu request này đã kích hoạt cứu hộ, tránh lặp vô hạn nếu Refresh Token cũng tèo
      originalRequest._retry = true;

      try {
        const currentRefreshToken = useAuthStore.getState().refreshToken;

        if (!currentRefreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi trực tiếp axios thô lên endpoint refresh (Tránh dùng instance 'api' để không bị dính interceptor)
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken: currentRefreshToken,
        });

        if (refreshResponse.data?.success) {
          const { user, accessToken, refreshToken } = refreshResponse.data.data;

          // Cập nhật lại kho lưu trữ Zustand với cặp khóa mới toanh
          useAuthStore.getState().setAuth(user, accessToken, refreshToken);

          // Cập nhật lại Header Authorization của request cũ bằng Access Token mới vừa bốc được
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Tái phát tín hiệu - Chạy lại request cũ thực tế cho người dùng
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 🎯 Lôi ra xài để vừa đúng ý ESLint, vừa có log gỡ lỗi dưới DevTools
        console.error(
          "🚨 [Axios Rescue] Refresh token flow failed:",
          refreshError,
        );

        useAuthStore.getState().clearAuth();
        window.location.href = "/login";
        return Promise.reject(
          new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."),
        );
      }
    }

    // Xử lý các lỗi thông thường khác (400, 409, 500...)
    const errorMessage =
      error.response?.data?.message || "Đã có lỗi hệ thống xảy ra";
    return Promise.reject(new Error(errorMessage));
  },
);
