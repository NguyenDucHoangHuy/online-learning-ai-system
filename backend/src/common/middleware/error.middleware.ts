import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod"; // QUAN TRỌNG: Import ZodError

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
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Chỉ nên log lỗi ra console khi không phải lỗi validation thông thường
  if (!(err instanceof ZodError)) {
    console.error(err);
  }

  // 1. Xử lý lỗi ném chủ động (AppError)
  if (err instanceof AppError) {
    return sendResponse(res, err.statusCode, err.message);
  }

  // 2. Xử lý lỗi Zod Validation
  if (err instanceof ZodError) {
    // Gom các thông báo lỗi của Zod thành một chuỗi dễ đọc (VD: "Email is invalid, Password is too short")
    // Dùng err.issues hoặc ép kiểu (err as ZodError).errors đều được
    const errorMessage = err.issues.map((e) => e.message).join(", ");
    return sendResponse(res, HTTP_STATUS.BAD_REQUEST, errorMessage);
  }

  // 3. Xử lý lỗi trùng lặp dữ liệu của Prisma
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return sendResponse(
      res,
      HTTP_STATUS.CONFLICT,
      "Dữ liệu này đã tồn tại trong hệ thống",
    );
  }

  // 4. Lỗi Server không xác định
  return sendResponse(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    MESSAGES.INTERNAL_SERVER_ERROR || "Lỗi hệ thống nội bộ",
  );
};
