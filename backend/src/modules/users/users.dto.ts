import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name is too long")
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
