// src/modules/participants/participants.service.ts
import { JoinStatus, SessionStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";

// ✅ Đã đổi tên cho rõ nghĩa (Teacher Ownership)
const findParticipantByTeacher = async (
  participantId: string,
  teacherId: string,
) => {
  const participant = await prisma.sessionParticipant.findFirst({
    where: {
      id: participantId,
      session: {
        class: {
          teacherId,
        },
      },
    },
  });

  if (!participant) {
    throw new AppError(MESSAGES.PARTICIPANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return participant;
};

export const participantsService = {
  joinSession: async (sessionId: string, studentId: string) => {
    const session = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        status: {
          in: [SessionStatus.WAITING, SessionStatus.ACTIVE],
        },
      },
    });

    if (!session) {
      throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const existingParticipant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        studentId,
      },
    });

    if (existingParticipant) {
      // ✅ Cải thiện UX/API: Ném lỗi Conflict nếu đã được duyệt
      if (existingParticipant.joinStatus === JoinStatus.APPROVED) {
        throw new AppError(MESSAGES.ALREADY_JOINED, HTTP_STATUS.CONFLICT);
      }

      // ✅ Tránh spam request nếu đang chờ duyệt
      if (existingParticipant.joinStatus === JoinStatus.PENDING) {
        throw new AppError(
          "Your request is already pending approval",
          HTTP_STATUS.CONFLICT,
        );
      }

      // Logic Rejoin: Chỉ chạy nếu trước đó bị REJECTED hoặc đã LEFT
      return prisma.sessionParticipant.update({
        where: {
          id: existingParticipant.id,
        },
        data: {
          joinStatus: session.requireApproval
            ? JoinStatus.PENDING
            : JoinStatus.APPROVED,
          joinedAt: session.requireApproval ? null : new Date(),
          leftAt: null,
          attemptNumber: {
            increment: 1,
          },
        },
      });
    }

    return prisma.sessionParticipant.create({
      data: {
        sessionId,
        studentId,
        joinStatus: session.requireApproval
          ? JoinStatus.PENDING
          : JoinStatus.APPROVED,
        joinedAt: session.requireApproval ? null : new Date(),
      },
    });
  },

  getParticipants: async (
    sessionId: string,
    teacherId: string,
    status?: JoinStatus,
  ) => {
    return prisma.sessionParticipant.findMany({
      where: {
        sessionId,
        session: {
          class: {
            teacherId,
          },
        },
        ...(status && { joinStatus: status }),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          joinedAt: {
            sort: "desc",
            nulls: "last",
          },
        },
      ],
    });
  },

  approveParticipant: async (participantId: string, teacherId: string) => {
    const participant = await findParticipantByTeacher(
      participantId,
      teacherId,
    );

    // ✅ Guard State: Chỉ PENDING mới được approve
    if (participant.joinStatus !== JoinStatus.PENDING) {
      throw new AppError(
        "Can only approve a participant with PENDING status",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return prisma.sessionParticipant.update({
      where: {
        id: participantId,
      },
      data: {
        joinStatus: JoinStatus.APPROVED,
        joinedAt: new Date(),
      },
    });
  },

  rejectParticipant: async (participantId: string, teacherId: string) => {
    const participant = await findParticipantByTeacher(
      participantId,
      teacherId,
    );

    // ✅ Guard State: Chỉ PENDING mới được reject
    if (participant.joinStatus !== JoinStatus.PENDING) {
      throw new AppError(
        "Can only reject a participant with PENDING status",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return prisma.sessionParticipant.update({
      where: {
        id: participantId,
      },
      data: {
        joinStatus: JoinStatus.REJECTED,
      },
    });
  },

  leaveSession: async (participantId: string, studentId: string) => {
    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        id: participantId,
        studentId,
      },
    });

    if (!participant) {
      throw new AppError(MESSAGES.PARTICIPANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // ✅ Guard State: Phải đang ở trong phòng (APPROVED) mới được leave
    if (participant.joinStatus !== JoinStatus.APPROVED) {
      throw new AppError(
        "Can only leave a session you have already joined",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return prisma.sessionParticipant.update({
      where: {
        id: participantId,
      },
      data: {
        joinStatus: JoinStatus.LEFT,
        leftAt: new Date(),
      },
    });
  },

  approveAllParticipants: async (sessionId: string, teacherId: string) => {
    // 1. Kiểm tra xem Giảng viên này có thực sự sở hữu Buổi học này không
    const session = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        class: {
          teacherId,
        },
      },
    });

    if (!session) {
      throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    // 2. Chạy lệnh update hàng loạt (Bulk Update) những sinh viên đang PENDING
    const updateResult = await prisma.sessionParticipant.updateMany({
      where: {
        sessionId,
        joinStatus: JoinStatus.PENDING, // Chỉ duyệt những người đang đợi
      },
      data: {
        joinStatus: JoinStatus.APPROVED,
        joinedAt: new Date(), // Đóng dấu thời gian tham gia đồng loạt
      },
    });

    return updateResult; // Trả về số lượng bản ghi đã được cập nhật { count: X }
  },
};
