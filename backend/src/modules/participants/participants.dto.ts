import { z } from "zod";

export const joinSessionSchema = z.object({
  // Tự động viết hoa code để tránh lỗi nhập "abcxyz" thay vì "ABCXYZ"
  sessionCode: z.string().length(6, "Invalid session code").transform((val) => val.toUpperCase()),
});

export const updateParticipantStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "LEFT"]),
});

export type JoinSessionDto = z.infer<typeof joinSessionSchema>;
export type UpdateParticipantStatusDto = z.infer<typeof updateParticipantStatusSchema>;