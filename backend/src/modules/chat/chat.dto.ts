import { z } from "zod";

export const sendMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must not exceed 1000 characters"),
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().uuid("Invalid cursor").optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type GetMessagesQueryDto = z.infer<typeof getMessagesQuerySchema>;
