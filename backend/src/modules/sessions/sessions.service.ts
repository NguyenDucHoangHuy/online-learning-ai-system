import { Role, SessionStatus, JoinStatus } from "@prisma/client";

import { prisma } from "../../prisma/client";

import { HTTP_STATUS, MESSAGES } from "../../common/constants";

import { AppError } from "../../common/middleware/error.middleware";

import { generateSessionCode } from "../../common/utils/string.util";

import { CreateSessionDto } from "./sessions.dto";

const generateUniqueSessionCode = async (): Promise<string> => {
  const MAX_RETRIES = 5;

  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateSessionCode();

    const existing = await prisma.classSession.findUnique({
      where: {
        sessionCode: code,
      },
    });

    if (!existing) {
      return code;
    }
  }

  throw new AppError(
    "Failed to generate unique session code",
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
};

const findOwnedSession = async (sessionId: string, teacherId: string) => {
  const session = await prisma.classSession.findFirst({
    where: {
      id: sessionId,
      class: {
        teacherId,
      },
    },
  });

  if (!session) {
    throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return session;
};

export const sessionsService = {
  createSession: async (
    classId: string,
    teacherId: string,
    data: CreateSessionDto,
  ) => {
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const sessionCode = await generateUniqueSessionCode();

    const session = await prisma.classSession.create({
      data: {
        classId,
        title: data.title,
        requireApproval: data.requireApproval,
        sessionCode,
        status: SessionStatus.WAITING,
      },
    });

    return session;
  },

  getSessionsByClass: async (classId: string, teacherId: string) => {
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId,
      },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return prisma.classSession.findMany({
      where: {
        classId,
      },

      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  },

  getSessionById: async (sessionId: string, userId: string, role: Role) => {
    if (role === Role.TEACHER) {
      const session = await prisma.classSession.findFirst({
        where: {
          id: sessionId,
          class: {
            teacherId: userId,
          },
        },

        include: {
          class: true,

          _count: {
            select: {
              participants: true,
              chatMessages: true,
            },
          },
        },
      });

      if (!session) {
        throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      return session;
    }

    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        studentId: userId,
        // ✅ Bổ sung Guard: Chỉ PENDING (đang đợi) hoặc APPROVED (đã vào) mới được xem
        joinStatus: { in: [JoinStatus.APPROVED, JoinStatus.PENDING] },
      },

      include: {
        session: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!participant) {
      throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    return participant.session;
  },

  startSession: async (sessionId: string, teacherId: string) => {
    const session = await findOwnedSession(sessionId, teacherId);
    // ✅ Bổ sung Guard State Machine
    if (session.status !== SessionStatus.WAITING) {
      throw new AppError(
        "Can only start the lesson from the WAITING state",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return prisma.classSession.update({
      where: {
        id: sessionId,
      },

      data: {
        status: SessionStatus.ACTIVE,
        startedAt: new Date(),
      },
    });
  },

  endSession: async (sessionId: string, teacherId: string) => {
    const session = await findOwnedSession(sessionId, teacherId);

    // ✅ Bổ sung Guard State Machine
    if (session.status !== SessionStatus.ACTIVE) {
      throw new AppError(
        "Can only end the lesson from the ACTIVE state",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ENDED,
        endedAt: new Date(),
      },
    });
  },

  lookupSession: async (sessionCode: string) => {
    const session = await prisma.classSession.findFirst({
      where: {
        sessionCode,
        status: {
          in: [SessionStatus.WAITING, SessionStatus.ACTIVE],
        },
      },

      // ✅ Data Minimization
      select: {
        id: true,
        title: true,
        status: true,
        requireApproval: true,
        sessionCode: true,

        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return session;
  },

  getMyHistory: async (studentId: string) => {
    return prisma.sessionParticipant.findMany({
      where: { studentId },
      include: {
        session: { include: { class: true } },
      },
      // ✅ Tối ưu hóa Sắp xếp Null (Null Sorting)
      orderBy: [
        { joinedAt: { sort: "desc", nulls: "last" } },
        { id: "desc" }, // Dự phòng sắp xếp theo thứ tự tạo nếu joinedAt trùng nhau
      ],
    });
  },
};
