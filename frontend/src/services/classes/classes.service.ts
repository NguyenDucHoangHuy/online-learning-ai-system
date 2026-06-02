import { api } from "../../lib/axios";
import {
  ClassesResponse,
  ClassResponse,
  CreateClassPayload,
} from "../../types/api";

export const classesService = {
  getClasses: async (): Promise<ClassesResponse> => {
    return api.get("/classes");
  },

  getClassById: async (classId: string): Promise<ClassResponse> => {
    return api.get(`/classes/${classId}`);
  },

  createClass: async (payload: CreateClassPayload): Promise<ClassResponse> => {
    return api.post("/classes", payload);
  },

  deleteClass: async (classId: string): Promise<ClassResponse> => {
    return api.delete(`/classes/${classId}`);
  },

  // 🔥 THÊM METHOD UPDATE NÀY ĐỂ LƯU CHỈNH SỬA VÀO DB
  updateClass: async (
    classId: string,
    payload: CreateClassPayload,
  ): Promise<ClassResponse> => {
    // Thường API update sẽ dùng PATCH hoặc PUT tùy thiết kế backend của bồ nhé, ở đây mình để PATCH
    return api.patch(`/classes/${classId}`, payload);
  },
};
