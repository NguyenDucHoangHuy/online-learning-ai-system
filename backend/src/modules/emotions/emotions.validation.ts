import { Request, Response, NextFunction } from "express";

import {
  analyzeStudentFrameSchema,
  createEmotionLogSchema,
  realtimeQuerySchema,
} from "./emotions.dto";

export const emotionsValidation = {
  createLog: (req: Request, _res: Response, next: NextFunction) => {
    req.body = createEmotionLogSchema.parse(req.body);
    next();
  },

  realtime: (req: Request, _res: Response, next: NextFunction) => {
    req.query = realtimeQuerySchema.parse(req.query) as any;
    next();
  },

  analyzeFrame: (req: Request, _res: Response, next: NextFunction) => {
    req.body = analyzeStudentFrameSchema.parse(req.body);
    next();
  },
};
