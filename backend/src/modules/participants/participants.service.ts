import { prisma } from "../../prisma/client";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";
import { JoinSessionDto, UpdateParticipantStatusDto } from "./participants.dto";

export const participantsService = {
  joinByCode: async (studentId: string, data: JoinSessionDto) => {
    // 1. Tìm session đang ACTIVE
    const session = await prisma.classSession.findFirst({
      where: { sessionCode: data.sessionCode, status: "ACTIVE" },
    });

    if (!session) {
      throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // 2. Check xem sinh viên này đã có trong danh sách chưa
    const existing = await prisma.sessionParticipant.findFirst({
      where: { sessionId: session.id, studentId },
    });

    if (existing) {
      // Nếu đã từng join (có thể đang PENDING hoặc bị REJECTED)
      return await prisma.sessionParticipant.update({
        where: { id: existing.id },
        data: { 
          attemptNumber: { increment: 1 },
          joinStatus: session.requireApproval ? "PENDING" : "APPROVED",
          joinedAt: session.requireApproval ? null : new Date(), // Reset thời gian nếu cần duyệt lại
        },
      });
    }

    // 3. Tạo mới nếu chưa từng join
    return await prisma.sessionParticipant.create({
      data: {
        sessionId: session.id,
        studentId,
        joinStatus: session.requireApproval ? "PENDING" : "APPROVED",
        joinedAt: session.requireApproval ? null : new Date(),
      },
    });
  },

  getPendingParticipants: async (sessionId: string, teacherId: string) => {
    return await prisma.sessionParticipant.findMany({
      where: {
        sessionId: sessionId,
        joinStatus: "PENDING",
        session: { class: { teacherId: teacherId } } // Bảo mật: Chỉ giáo viên dạy lớp đó mới xem được
      },
      include: { 
        student: { 
          select: { id: true, fullName: true, email: true } 
        } 
      },
      orderBy: { id: "asc" }
    });
  },

  updateStatus: async (participantId: string, teacherId: string, data: UpdateParticipantStatusDto) => {
    const participant = await prisma.sessionParticipant.findFirst({
      where: { 
        id: participantId, 
        session: { class: { teacherId: teacherId } } 
      },
    });

    if (!participant) {
      throw new AppError("Participant request not found", HTTP_STATUS.NOT_FOUND);
    }

    return await prisma.sessionParticipant.update({
      where: { id: participantId },
      data: { 
        joinStatus: data.status,
        joinedAt: data.status === "APPROVED" ? new Date() : undefined,
        leftAt: data.status === "LEFT" ? new Date() : undefined
      },
    });
  }
};