import { Request, Response } from "express";
import { chatService } from "./chat.service";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";
import { GetMessagesQueryDto } from "./chat.dto";

export const chatController = {
  getMessages: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as GetMessagesQueryDto;

    const result = await chatService.getMessages(
      req.params.sessionId,
      req.user!.id,
      req.user!.role,
      query,
    );

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.sendMessage(
      req.params.sessionId,
      req.user!.id,
      req.body,
    );

    return sendResponse(res, HTTP_STATUS.CREATED, MESSAGES.SUCCESS, result);
  }),
};
