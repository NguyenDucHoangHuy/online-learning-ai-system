import { Request, Response } from "express";

import { usersService } from "./users.service";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";

import { asyncHandler } from "../../common/utils/async-handler.util";

export const usersController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await usersService.getMe(userId);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.SUCCESS, result);
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await usersService.updateProfile(userId, req.body);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.PROFILE_UPDATED, result);
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await usersService.changePassword(userId, req.body);

    return sendResponse(res, HTTP_STATUS.OK, MESSAGES.PASSWORD_CHANGED);
  }),
};
