import bcrypt from "bcryptjs";

import { prisma } from "../../prisma/client";
import { Role } from "@prisma/client"; // Đảm bảo dùng đúng Enum từ Prisma

import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";

import { jwtUtil } from "../../common/utils/jwt.util";
import { env } from "../../config/env";
import { LoginDto, RegisterDto } from "./auth.dto";

// Hàm tiện ích tự động bóc tách số ngày từ biến môi trường JWT_REFRESH_EXPIRES_IN (Ví dụ: "7d" -> 7)
const parseRefreshTokenDays = (): number => {
  const val = env.JWT_REFRESH_EXPIRES_IN; // "7d"
  const match = val.match(/^(\d+)d$/);
  return match ? parseInt(match[1], 10) : 7; // Fallback về 7 ngày nếu parse lỗi
};

const buildAuthResponse = async (user: {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}) => {
  const accessToken = jwtUtil.generateAccessToken({
    id: user.id,
    role: user.role,
  });

  const rawRefreshToken = jwtUtil.generateRawRefreshToken();

  const hashedRefreshToken = jwtUtil.hashToken(rawRefreshToken);

  const expiresAt = new Date();

  const refreshDays = parseRefreshTokenDays();
  expiresAt.setDate(expiresAt.getDate() + refreshDays);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
};

export const register = async (payload: RegisterDto) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (existingUser) {
    throw new AppError(MESSAGES.EMAIL_ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: payload.email,
      passwordHash: hashedPassword,
      role: payload.role, // Zod đã đảm bảo payload.role khớp với chuẩn Role Enum
    },
  });

  return buildAuthResponse(user);
};

export const login = async (payload: LoginDto) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordValid = await bcrypt.compare(
    payload.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
  }

  return buildAuthResponse(user);
};

export const refresh = async (refreshToken: string) => {
  const hashedToken = jwtUtil.hashToken(refreshToken);

  const existingToken = await prisma.refreshToken.findUnique({
    where: {
      token: hashedToken,
    },
    include: {
      user: true,
    },
  });

  if (!existingToken) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  if (existingToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: {
        id: existingToken.id,
      },
    });

    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  // Token Rotation - Hủy ngay token cũ để chống Replay Attack
  await prisma.refreshToken.delete({
    where: { id: existingToken.id },
  });

  // existingToken.user tự động thừa hưởng type Role nhờ Prisma Relation
  return buildAuthResponse(existingToken.user);
};

export const logout = async (refreshToken: string) => {
  const hashedToken = jwtUtil.hashToken(refreshToken);

  await prisma.refreshToken.deleteMany({
    where: {
      token: hashedToken,
    },
  });

  return null;
};

export const getMe = async (userId: string) => {
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
    },
  });

  if (!user) {
    throw new AppError(MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return user;
};
