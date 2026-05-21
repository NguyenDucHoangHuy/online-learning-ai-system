import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../../config/env";
import { HTTP_STATUS, MESSAGES } from "../constants";
import { sendResponse } from "../utils/response.util";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET,
    ) as Express.Request["user"];

    req.user = decoded;
    next();
  } catch (error) {
    // Bắt chính xác lỗi hết hạn token của jsonwebtoken
    if (error instanceof jwt.TokenExpiredError) {
      return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, "Token expired");
    }

    // Các lỗi khác (sai chữ ký, token bị sửa đổi...)
    return sendResponse(res, HTTP_STATUS.UNAUTHORIZED, MESSAGES.UNAUTHORIZED);
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, MESSAGES.FORBIDDEN);
    }

    next();
  };
};
