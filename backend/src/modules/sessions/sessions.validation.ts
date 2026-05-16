import { Request, Response, NextFunction } from "express";
import { createSessionSchema, updateSessionStatusSchema } from "./sessions.dto";

export const sessionsValidation = {
  createSession: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = createSessionSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },

  updateStatus: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = updateSessionStatusSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },
};