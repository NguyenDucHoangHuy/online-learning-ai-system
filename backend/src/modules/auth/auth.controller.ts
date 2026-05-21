import { Request, Response } from "express";

import { asyncHandler } from "../../common/utils/async-handler.util";
import { sendResponse } from "../../common/utils/response.util";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import * as authService from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);

  return sendResponse(
    res,
    HTTP_STATUS.CREATED,
    MESSAGES.REGISTER_SUCCESS,
    result,
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.LOGIN_SUCCESS, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.refresh(req.body.refreshToken);

  return sendResponse(res, HTTP_STATUS.OK, "Refresh token successful", result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.body.refreshToken);

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.LOGOUT_SUCCESS);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.getMe(req.user!.id);

  return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
});
