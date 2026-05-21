import { Request, Response, NextFunction } from "express";
import { sendMessageSchema, getMessagesQuerySchema } from "./chat.dto";

export const chatValidation = {
  sendMessage: (req: Request, _res: Response, next: NextFunction) => {
    req.body = sendMessageSchema.parse(req.body);
    next();
  },

  getMessages: (req: Request, _res: Response, next: NextFunction) => {
    req.query = getMessagesQuerySchema.parse(req.query) as any;
    next();
  },
};
