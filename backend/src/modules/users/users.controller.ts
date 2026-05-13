import { Request, Response } from "express";

import { usersService } from "./users.service";

import { HTTP_STATUS } from "../../common/constants";

import { sendResponse } from "../../common/utils/response.util";

import { asyncHandler } from "../../common/utils/async-handler.util";

export const usersController = {
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await usersService.updateProfile(userId, req.body);

    return sendResponse(
      res,
      HTTP_STATUS.OK,
      "Profile updated successfully",
      result,
    );
  }),
};
