// src/services/ai/ai.service.ts
import axios from "axios";

// Khởi tạo instance riêng biệt hướng thẳng sang cổng dịch vụ Python Flask
const aiApi = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const aiService = {
  /**
   * Trích xuất phân tích trạng thái tâm lý học và độ tập trung từ frame webcam
   */
  detectEmotion: async (image: string) => {
    const response = await aiApi.post("/detect-emotion", { image });
    return response.data;
  },
};
