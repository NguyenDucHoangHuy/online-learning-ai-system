import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),

  requireApproval: z.boolean().optional().default(false),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
