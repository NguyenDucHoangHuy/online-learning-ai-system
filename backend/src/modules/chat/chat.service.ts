import { prisma } from "../../prisma/client";
import { SendMessageDto } from "./chat.dto";

export const chatService = {
  saveMessage: async (userId: string, data: SendMessageDto) => {
    return await prisma.chatMessage.create({
      data: {
        userId,
        sessionId: data.sessionId,
        message: data.message,
      },
      include: {
        user: {
          select: { fullName: true, role: true },
        },
      },
    });
  },

  getSessionMessages: async (sessionId: string) => {
    return await prisma.chatMessage.findMany({
      where: { sessionId },
      include: {
        user: {
          select: { fullName: true, role: true },
        },
      },
      orderBy: { sentAt: "asc" },
    });
  },
};
