import { Response } from "express";
import { HTTP_STATUS, MESSAGES } from "../constants";

export const sendResponse = <T>(
  res: Response,
  statusCode: number = HTTP_STATUS.OK,
  message: string = MESSAGES.SUCCESS,
  data?: T,
  meta?: any,
) => {
  res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data: data ?? null,
    meta: meta ?? undefined,
  });
};
