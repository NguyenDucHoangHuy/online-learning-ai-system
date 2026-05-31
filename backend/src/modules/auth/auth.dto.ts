import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),

  email: z.email("Invalid email address").toLowerCase(),

  password: z.string().min(6, "Password must be at least 6 characters"),

  role: z.enum([Role.STUDENT, Role.TEACHER]),

  teacherCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address").toLowerCase(),

  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutDto = z.infer<typeof logoutSchema>;
