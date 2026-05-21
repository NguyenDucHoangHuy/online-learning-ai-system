import bcrypt from "bcryptjs";

import { prisma } from "../../prisma/client";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { AppError } from "../../common/middleware/error.middleware";

import { UpdateProfileDto, ChangePasswordDto } from "./users.dto";

const findUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user;
};

export const usersService = {
  getMe: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return user;
  },

  updateProfile: async (userId: string, data: UpdateProfileDto) => {
    await findUserById(userId);

    return prisma.user.update({
      where: {
        id: userId,
      },

      data: {
        fullName: data.fullName,
      },

      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  },

  changePassword: async (userId: string, data: ChangePasswordDto) => {
    const user = await findUserById(userId);

    const isPasswordCorrect = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordCorrect) {
      throw new AppError(
        MESSAGES.INVALID_CREDENTIALS,
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId,
        },

        data: {
          passwordHash: hashedPassword,
        },
      }),

      // Revoke toàn bộ refresh token
      prisma.refreshToken.deleteMany({
        where: {
          userId,
        },
      }),
    ]);
  },
};
