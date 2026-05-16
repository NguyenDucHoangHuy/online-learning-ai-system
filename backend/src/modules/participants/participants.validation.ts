import { Request, Response, NextFunction } from "express";
import { joinSessionSchema, updateParticipantStatusSchema } from "./participants.dto";

export const participantsValidation = {
  joinSession: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = joinSessionSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },

  updateStatus: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = updateParticipantStatusSchema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  },
};