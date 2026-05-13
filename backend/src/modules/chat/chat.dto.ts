import { z } from "zod";

export const sendMessageSchema = z.object({
  sessionId: z.string().uuid("Invalid Session ID"),
  message: z.string().min(1, "Message cannot be empty"),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
