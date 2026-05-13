import { Request, Response, NextFunction } from "express";
import { logEmotionSchema } from "./emotions.dto";

export const emotionsValidation = {
  /**
   * Validate dữ liệu log cảm xúc và độ tập trung
   */
  logAiEmotion: (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Parse và validate dữ liệu body dựa trên logEmotionSchema (Zod)
      req.body = logEmotionSchema.parse(req.body);
      next();
    } catch (error) {
      // Nếu có lỗi, chuyển sang middleware xử lý lỗi (error.middleware.ts)
      next(error);
    }
  },
};