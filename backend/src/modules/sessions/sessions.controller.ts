import { Request, Response } from "express";
import { sessionsService } from "./sessions.service";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";

export const sessionsController = {
  createSession: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const result = await sessionsService.createSession(teacherId, req.body);

    return sendResponse(res, HTTP_STATUS.CREATED, MESSAGES.SUCCESS, result);
  }),

  endSession: asyncHandler(async (req: Request, res: Response) => {
    const teacherId = req.user!.id;
    const result = await sessionsService.endSession(req.params.sessionId, teacherId);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),
};