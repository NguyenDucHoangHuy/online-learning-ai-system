import { Request, Response, NextFunction } from "express";
import { getParticipantsQuerySchema } from "./participants.dto";

export const participantsValidation = {
  getParticipants: (req: Request, _res: Response, next: NextFunction) => {
    // Ép kiểu và validate dữ liệu từ URL query
    req.query = getParticipantsQuerySchema.parse(req.query);
    next();
  },
};
