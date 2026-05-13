import { Role } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),

  email: z.email("Invalid email address").toLowerCase(),

  password: z.string().min(6, "Password must be at least 6 characters"),

  role: z.enum([Role.STUDENT, Role.TEACHER]),
});

export const loginSchema = z.object({
  email: z.email("Invalid email address").toLowerCase(),

  password: z.string().min(6, "Password must be at least 6 characters"),
});
