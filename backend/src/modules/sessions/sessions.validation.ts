// src/modules/sessions/sessions.validation.ts
import { Request, Response, NextFunction } from "express";
import { createSessionSchema } from "./sessions.dto";

export const sessionsValidation = {
  createSession: (req: Request, _res: Response, next: NextFunction) => {
    // Zod thực hiện parse và validate toàn cục, nếu dính lỗi (quá 3 tiếng, sai giờ...)
    // nó sẽ tự động ném ra ZodError để Bộ xử lý lỗi toàn cục (Global Error Handler) bốc về xử lý.
    req.body = createSessionSchema.parse(req.body);

    next();
  },
};
