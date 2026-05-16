import { prisma } from "../../prisma/client";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";
import { CreateSessionDto } from "./sessions.dto";

export const sessionsService = {
  createSession: async (teacherId: string, data: CreateSessionDto) => {
    const existingClass = await prisma.class.findFirst({
      where: { id: data.classId, teacherId },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    return await prisma.classSession.create({
      data: {
        title: data.title,
        sessionCode,
        classId: data.classId,
        requireApproval: data.requireApproval,
        status: "ACTIVE", // Đã sửa thành viết hoa theo enum SessionStatus
        startedAt: new Date(),
      },
    });
  },

  endSession: async (sessionId: string, teacherId: string) => {
    const session = await prisma.classSession.findFirst({
      where: { id: sessionId, class: { teacherId } },
    });

    if (!session) {
      throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return await prisma.classSession.update({
      where: { id: sessionId },
      data: { 
        status: "ENDED", // Đã sửa thành viết hoa
        endedAt: new Date() 
      },
    });
  },
};