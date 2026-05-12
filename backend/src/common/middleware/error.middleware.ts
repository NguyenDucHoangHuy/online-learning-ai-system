import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.util";
import { HTTP_STATUS } from "../constants";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error("❌ Error:", err.message);

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma errors
  if (err.message.includes("Unique constraint")) {
    sendError(res, "Resource already exists", HTTP_STATUS.CONFLICT);
    return;
  }

  sendError(res, "Internal server error", HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

export const notFoundMiddleware = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.originalUrl} not found`, HTTP_STATUS.NOT_FOUND);
};
