import { Request, Response, NextFunction } from "express";

import { updateProfileSchema, changePasswordSchema } from "./users.dto";

export const usersValidation = {
  updateProfile: (req: Request, _res: Response, next: NextFunction) => {
    req.body = updateProfileSchema.parse(req.body);
    next();
  },

  changePassword: (req: Request, _res: Response, next: NextFunction) => {
    req.body = changePasswordSchema.parse(req.body);
    next();
  },
};
