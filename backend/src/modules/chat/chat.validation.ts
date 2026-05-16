import { Request, Response, NextFunction } from "express";
import { sendMessageSchema } from "./chat.dto";

export const chatValidation = {
  /**
   * Validate dữ liệu tin nhắn gửi đi
   */
  sendMessage: (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Đảm bảo body chứa sessionId và message hợp lệ
      req.body = sendMessageSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },
};
