import { z } from "zod";

export const createSessionSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  title: z.string().min(1, "Title is required").max(150),
  requireApproval: z.boolean().default(false),
});

export const updateSessionStatusSchema = z.object({
  status: z.enum(["WAITING", "ACTIVE", "ENDED"]),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionStatusDto = z.infer<typeof updateSessionStatusSchema>;