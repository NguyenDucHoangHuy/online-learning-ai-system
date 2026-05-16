import { prisma } from "../../prisma/client";
import { LogEmotionDto } from "./emotions.dto";

export const emotionsService = {
  saveAiLog: async (data: LogEmotionDto) => {
    return await prisma.emotionLog.create({
      data: {
        participantId: data.participantId,
        emotion: data.emotion,
        attentionLevel: data.attentionLevel,
        confidence: data.confidence,
      },
    });
  },

  getSessionStats: async (sessionId: string) => {
    return await prisma.emotionLog.groupBy({
      by: ["emotion", "attentionLevel"],
      where: {
        participant: { sessionId },
      },
      _count: true,
    });
  },
};
