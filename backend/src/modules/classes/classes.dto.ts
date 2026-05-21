import { z } from "zod";

export const createClassSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Class name is required")
    .max(100, "Class name must not exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
});

export const updateClassSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Class name is required")
      .max(100, "Class name must not exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description must not exceed 500 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;
