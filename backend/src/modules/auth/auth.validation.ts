import { Request, Response, NextFunction } from "express";

import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from "./auth.dto";

export const authValidation = {
  register: (req: Request, _res: Response, next: NextFunction) => {
    req.body = registerSchema.parse(req.body);
    next();
  },

  login: (req: Request, _res: Response, next: NextFunction) => {
    req.body = loginSchema.parse(req.body);
    next();
  },

  refresh: (req: Request, _res: Response, next: NextFunction) => {
    req.body = refreshTokenSchema.parse(req.body);
    next();
  },

  logout: (req: Request, _res: Response, next: NextFunction) => {
    req.body = logoutSchema.parse(req.body);
    next();
  },
};
