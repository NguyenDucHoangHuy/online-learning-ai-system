import { Request, Response } from "express";
import { emotionsService } from "./emotions.service";
import { HTTP_STATUS } from "../../common/constants";
import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";
import { logEmotionSchema } from "./emotions.dto";

export const emotionsController = {
  logAiEmotion: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = logEmotionSchema.parse(req.body);
    const result = await emotionsService.saveAiLog(validatedData);
    return sendResponse(res, HTTP_STATUS.CREATED, "Emotion recorded", result);
  }),

  getSessionStats: asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const result = await emotionsService.getSessionStats(sessionId);
    return sendResponse(res, HTTP_STATUS.OK, "Success", result);
  }),
};
