// src/common/middleware/api-key.middleware.ts
import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";

export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || apiKey !== env.AI_SERVICE_KEY) {
    return res.status(401).json({ message: "Unauthorized M2M Access" });
  }
  next();
};
