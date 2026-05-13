import { prisma } from "../../prisma/client";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { AppError } from "../../common/middleware/error.middleware";

import { UpdateProfileDto } from "./users.dto";

export const usersService = {
  updateProfile: async (userId: string, data: UpdateProfileDto) => {
    if (Object.keys(data).length === 0) {
      throw new AppError("No update data provided", HTTP_STATUS.BAD_REQUEST);
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },

      data,

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },
};
