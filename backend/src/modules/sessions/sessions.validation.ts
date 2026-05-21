import { Request, Response, NextFunction } from "express";

import { createSessionSchema } from "./sessions.dto";

export const sessionsValidation = {
  createSession: (req: Request, _res: Response, next: NextFunction) => {
    req.body = createSessionSchema.parse(req.body);

    next();
  },
};
