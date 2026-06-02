import { Request, Response } from "express";

import { sessionsService } from "./sessions.service";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";

import { asyncHandler } from "../../common/utils/async-handler.util";

export const sessionsController = {
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await sessionsService.createSession(
      req.params.classId,
      teacherId,
      req.body,
    );

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      MESSAGES.SESSION_CREATED,
      result,
    );
  }),

  getSessionsByClass: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await sessionsService.getSessionsByClass(
      req.params.classId,
      teacherId,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  getSessionById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const result = await sessionsService.getSessionById(
      req.params.sessionId,
      userId,
      userRole,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  startSession: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    const result = await sessionsService.startSession(
      req.params.sessionId,
      teacherId,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SESSION_STARTED, result);
  }),

  endSession: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;

    // Allow caller to specify who ended the session (TEACHER | SYSTEM)
    const endedBy = req.body?.endedBy as "TEACHER" | "SYSTEM" | undefined;

    const result = await sessionsService.endSession(
      req.params.sessionId,
      teacherId,
      endedBy,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SESSION_ENDED, result);
  }),

  lookupSession: asyncHandler(async (req: Request, res: Response) => {
    const result = await sessionsService.lookupSession(req.params.sessionCode);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  getMyHistory: asyncHandler(async (req: Request, res: Response) => {
    const studentId = req.user!.id;

    const result = await sessionsService.getMyHistory(studentId);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  getRecentSessions: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id; // Bốc chuẩn xác ID của Giảng viên từ token đăng nhập

    const result = await sessionsService.getRecentSessions(teacherId);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),
  getSessionHistory: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id; // Bốc ID chuẩn xác từ token đăng nhập

    const result = await sessionsService.getSessionHistory(teacherId);

    // Trả trực tiếp mảng dữ liệu về để Frontend tự động bóc tách thông minh
    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),
};
