// src/services/auth/auth.service.ts
import { api } from "../../lib/axios";
import { LoginPayload, RegisterPayload, AuthResponse } from "../../types/api/";

export const authService = {
  /**
   * 1. Luồng xử lý Đăng nhập
   * Gửi email và password lên Backend để xác thực danh tính
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    // Nhờ Interceptor ở lib/axios trả về response.data, ở đây ta nhận luôn cục dữ liệu sạch
    return api.post("/auth/login", payload);
  },

  /**
   * 2. Luồng xử lý Đăng ký tài khoản
   * Khởi tạo tài khoản mới cho cả STUDENT lẫn TEACHER
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return api.post("/auth/register", payload);
  },

  /**
   * 3. Luồng xử lý Đăng xuất
   * Gửi yêu cầu xóa Refresh Token dưới Database của Backend
   */
  logout: async (): Promise<{ success: boolean; message?: string }> => {
    return api.post("/auth/logout");
  },

  /**
   * 4. Luồng làm mới cặp mã xác thực tự động (Silent Refresh Token)
   * Sử dụng khi Access Token hết hạn để bốc một chuỗi Access Token mới mà không làm gián đoạn người dùng
   */
  refreshToken: async (
    refreshToken: string,
  ): Promise<{
    success: boolean;
    data: { accessToken: string; refreshToken: string };
  }> => {
    return api.post("/auth/refresh", { refreshToken });
  },
};
