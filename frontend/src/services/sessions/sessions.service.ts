// src/services/sessions/sessions.service.ts
import { api } from "../../lib/axios";
import {
  CreateSessionPayload,
  SessionResponse,
  SessionsResponse,
  LookupSessionResponse,
  StudentHistoryResponse,
  SessionDetailResponse,
  DashboardStatsResponse,
} from "../../types/api";

export const sessionsService = {
  /**
   * Teacher tạo session mới
   */
  createSession: async (
    classId: string,
    payload: CreateSessionPayload,
  ): Promise<SessionResponse> => {
    return api.post(`/classes/${classId}/sessions`, payload);
  },

  /**
   * Student check phòng và xin gia nhập bằng sessionCode
   * 🎯 ĐỒNG BỘ BE: Chuyển sang GET truyền param sạch theo đúng định tuyến Router của Backend
   */
  lookupSession: async (
    sessionCode: string,
  ): Promise<LookupSessionResponse> => {
    return api.get(`/sessions/join/${sessionCode}`);
  },

  /**
   * Lấy chi tiết session bằng khóa chính ID (UUID từ database)
   */
  getSessionById: async (sessionId: string): Promise<SessionDetailResponse> => {
    return api.get(`/sessions/${sessionId}`);
  },

  /**
   * Teacher kích hoạt bắt đầu buổi học (Đổi status sang ACTIVE)
   */
  startSession: async (sessionId: string): Promise<SessionResponse> => {
    return api.patch(`/sessions/${sessionId}/start`);
  },

  /**
   * Teacher kết thúc buổi học (Đổi status sang ENDED)
   */
  endSession: async (sessionId: string): Promise<SessionResponse> => {
    return api.patch(`/sessions/${sessionId}/end`);
  },

  /**
   * Lấy danh sách các buổi học thuộc một lớp học cụ thể
   */
  getSessionsByClassId: async (classId: string): Promise<SessionsResponse> => {
    return api.get(`/classes/${classId}/sessions`);
  },

  /**
   * Student lấy toàn bộ lịch sử tham gia phòng học trực tuyến của mình
   */
  getStudentHistory: async (): Promise<StudentHistoryResponse> => {
    return api.get("/sessions/my-history");
  },

  getTeacherSessions: async (): Promise<SessionsResponse> => {
    return api.get("/sessions/teacher-history");
    // 💡 Ghi chú: Nếu endpoint backend của bồ đặt tên khác (ví dụ: "/sessions" hoặc "/sessions/all"), hãy sửa lại router này cho khớp nhé!
  },

  // Thêm vào cuối cùng của object sessionsService trong file src/services/sessions/sessions.service.ts
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    return api.get("/sessions/teacher-dashboard/stats");
  },
};
