import { Request, Response } from "express";

import { emotionsService } from "./emotions.service";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";

import { asyncHandler } from "../../common/utils/async-handler.util";

export const emotionsController = {
  analyzeStudentFrame: asyncHandler(async (req: Request, res: Response) => {
    if (req.user?.role !== "STUDENT") {
      return sendResponse(res, HTTP_STATUS.FORBIDDEN, MESSAGES.FORBIDDEN);
    }

    const result = await emotionsService.analyzeStudentFrame(
      req.params.sessionId,
      req.user.id,
      req.body,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  createLog: asyncHandler(async (req: Request, res: Response) => {
    const result = await emotionsService.createLog(req.body);

    return sendResponse(
      res,
      HTTP_STATUS.CREATED,
      "Emotion log created",
      result,
    );
  }),

  getRealtime: asyncHandler(async (req: Request, res: Response) => {
    const result = await emotionsService.getRealtimeSnapshot(
      req.params.sessionId,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  getSessionReport: asyncHandler(async (req: Request, res: Response) => {
    const result = await emotionsService.getSessionReport(req.params.sessionId);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  getParticipantLogs: asyncHandler(async (req: Request, res: Response) => {
    const result = await emotionsService.getParticipantLogs(
      req.params.participantId,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  getMyLogs: asyncHandler(async (req: Request, res: Response) => {
    const result = await emotionsService.getMyLogs(
      req.params.sessionId,
      req.user!.id,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),
};
