import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),

  description: z.string().max(500).optional(),
});

export const updateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),

  description: z.string().max(500).optional(),
});

export type CreateClassDto = z.infer<typeof createClassSchema>;

export type UpdateClassDto = z.infer<typeof updateClassSchema>;
