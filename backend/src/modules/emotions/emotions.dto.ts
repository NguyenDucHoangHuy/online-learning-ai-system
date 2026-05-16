import { z } from "zod";
import { Emotion, AttentionLevel } from "@prisma/client";

export const logEmotionSchema = z.object({
  participantId: z.string().uuid("Invalid Participant ID"),
  emotion: z.nativeEnum(Emotion),
  attentionLevel: z.nativeEnum(AttentionLevel),
  confidence: z.number().min(0).max(1),
});

export type LogEmotionDto = z.infer<typeof logEmotionSchema>;