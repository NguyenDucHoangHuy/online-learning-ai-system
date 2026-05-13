import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

import { HTTP_STATUS, MESSAGES } from "../constants";
import { sendResponse } from "../utils/response.util";

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
) => {
  console.error(err);

  if (err instanceof AppError) {
    return sendResponse(res, err.statusCode, err.message);
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return sendResponse(res, HTTP_STATUS.CONFLICT, "Resource already exists");
  }

  return sendResponse(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    MESSAGES.INTERNAL_SERVER_ERROR,
  );
};
