import { Request, Response } from "express";

import { HTTP_STATUS } from "../constants";
import { sendResponse } from "../utils/response.util";

export const notFoundMiddleware = (req: Request, res: Response) => {
  return sendResponse(
    res,
    HTTP_STATUS.NOT_FOUND,
    `Route ${req.originalUrl} not found`,
  );
};
