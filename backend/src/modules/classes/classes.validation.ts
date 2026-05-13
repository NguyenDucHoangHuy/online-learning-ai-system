import { Request, Response, NextFunction } from "express";

import { createClassSchema, updateClassSchema } from "./classes.dto";

export const classesValidation = {
  createClass: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = createClassSchema.parse(req.body);

      next();
    } catch (error) {
      next(error);
    }
  },

  updateClass: (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = updateClassSchema.parse(req.body);

      next();
    } catch (error) {
      next(error);
    }
  },
};
