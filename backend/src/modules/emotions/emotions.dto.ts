import { z } from "zod";
import { EmotionType, AttentionLevel } from "@prisma/client";

export const createEmotionLogSchema = z.object({
  participantId: z.string().uuid(),

  emotion: z.nativeEnum(EmotionType),

  confidence: z.number().min(0).max(1),

  attentionLevel: z.nativeEnum(AttentionLevel),
});

export const realtimeQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreateEmotionLogDto = z.infer<typeof createEmotionLogSchema>;

export type RealtimeQueryDto = z.infer<typeof realtimeQuerySchema>;
