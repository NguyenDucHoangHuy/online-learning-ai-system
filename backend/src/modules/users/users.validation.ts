import { Request, Response, NextFunction } from "express";

import { updateProfileSchema } from "./users.dto";

export const usersValidation = {
  updateProfile: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = updateProfileSchema.parse(req.body);

      next();
    } catch (error) {
      next(error);
    }
  },
};
