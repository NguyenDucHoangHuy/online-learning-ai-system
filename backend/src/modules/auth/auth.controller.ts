import { Request, Response } from "express";

import { asyncHandler } from "../../common/utils/async-handler.util";
import { sendResponse } from "../../common/utils/response.util";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import * as authService from "./auth.service";

import { loginSchema, registerSchema } from "./auth.validation";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);

  const result = await authService.register(validatedData);

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    MESSAGES.REGISTER_SUCCESS,
    result,
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  const result = await authService.login(validatedData);

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.LOGIN_SUCCESS, result);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.id);

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
});
