import { Request, Response } from "express";
import { chatService } from "./chat.service";
import { HTTP_STATUS } from "../../common/constants";
import { sendResponse } from "../../common/utils/response.util";
import { asyncHandler } from "../../common/utils/async-handler.util";
import { sendMessageSchema } from "./chat.dto";

export const chatController = {
  sendMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const validatedData = sendMessageSchema.parse(req.body);
    const result = await chatService.saveMessage(userId, validatedData);
    return sendResponse(res, HTTP_STATUS.CREATED, "Message sent", result);
  }),

  getMessages: asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const result = await chatService.getSessionMessages(sessionId);
    return sendResponse(res, HTTP_STATUS.OK, "Success", result);
  }),
};
