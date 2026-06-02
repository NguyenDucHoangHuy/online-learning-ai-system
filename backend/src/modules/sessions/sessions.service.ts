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

const attentionScoreByLevel = {
  HIGH: 100,
  MEDIUM: 60,
  LOW: 25,
} as const;

const getDurationMinutes = (
  joinedAt: Date | null,
  leftAt: Date | null,
  sessionEndedAt: Date | null,
) => {
  if (!joinedAt) return 0;

  const endTime = leftAt ?? sessionEndedAt ?? new Date();
  return Math.max(
    0,
    Math.round((endTime.getTime() - joinedAt.getTime()) / 1000 / 60),
  );
};

const getPrimaryEmotion = (
  logs: Array<{ emotion: string; confidence: number }>,
) => {
  if (logs.length === 0) return "NEUTRAL";

  const emotionScores = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.emotion] = (acc[log.emotion] ?? 0) + log.confidence;
    return acc;
  }, {});

  return Object.entries(emotionScores).sort((a, b) => b[1] - a[1])[0][0];
};

const getAttentionIndex = (
  logs: Array<{ attentionLevel: keyof typeof attentionScoreByLevel }>,
) => {
  if (logs.length === 0) return 0;

  const total = logs.reduce(
    (sum, log) => sum + attentionScoreByLevel[log.attentionLevel],
    0,
  );

  return Math.round(total / logs.length);
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

  getTeacherSessions: async (teacherId: string) => {
    return prisma.classSession.findMany({
      where: {
        class: {
          teacherId,
        },
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

  getTeacherDashboardStats: async (teacherId: string) => {
    const [totalClasses, totalSessions, questionsAsked, recentSessions] =
      await Promise.all([
        prisma.class.count({
          where: { teacherId },
        }),
        prisma.classSession.count({
          where: {
            class: {
              teacherId,
            },
          },
        }),
        prisma.chatMessage.count({
          where: {
            session: {
              class: {
                teacherId,
              },
            },
          },
        }),
        prisma.classSession.findMany({
          where: {
            class: {
              teacherId,
            },
          },
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        }),
      ]);

    const [highAttentionLogs, totalAttentionLogs] = await Promise.all([
      prisma.emotionLog.count({
        where: {
          attentionLevel: "HIGH",
          participant: {
            session: {
              class: {
                teacherId,
              },
            },
          },
        },
      }),
      prisma.emotionLog.count({
        where: {
          participant: {
            session: {
              class: {
                teacherId,
              },
            },
          },
        },
      }),
    ]);

    const avgAttention =
      totalAttentionLogs === 0
        ? "0%"
        : `${Math.round((highAttentionLogs / totalAttentionLogs) * 100)}%`;

    return {
      stats: {
        totalClasses,
        totalSessions,
        avgAttention,
        questionsAsked,
      },
      recentSessions,
    };
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
          participants: {
            where: {
              joinStatus: {
                in: [JoinStatus.APPROVED, JoinStatus.LEFT],
              },
            },
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              emotionLogs: {
                orderBy: {
                  recordedAt: "asc",
                },
              },
            },
            orderBy: [
              {
                joinedAt: {
                  sort: "asc",
                  nulls: "last",
                },
              },
            ],
          },

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

      const reportParticipants = session.participants.map((participant) => ({
        id: participant.id,
        studentId: participant.studentId,
        fullName: participant.student.fullName,
        email: participant.student.email,
        joinStatus: participant.joinStatus,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt,
        duration: getDurationMinutes(
          participant.joinedAt,
          participant.leftAt,
          session.endedAt,
        ),
        attentionIndex: getAttentionIndex(participant.emotionLogs),
        primaryState: getPrimaryEmotion(participant.emotionLogs),
        emotionLogs: participant.emotionLogs,
      }));

      const emotionLogs = reportParticipants.flatMap((participant) =>
        participant.emotionLogs.map((log) => ({
          recordedAt: log.recordedAt,
          attentionIndex: attentionScoreByLevel[log.attentionLevel],
        })),
      );

      const timeline = emotionLogs
        .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
        .map((log, index) => ({
          minute: index,
          attentionIndex: log.attentionIndex,
          recordedAt: log.recordedAt,
        }));

      return {
        ...session,
        participants: reportParticipants,
        reportSummary: {
          averageAttention: getAttentionIndex(
            session.participants.flatMap((participant) =>
              participant.emotionLogs.map((log) => ({
                attentionLevel: log.attentionLevel,
              })),
            ),
          ),
          totalParticipants: reportParticipants.length,
          totalEmotionLogs: emotionLogs.length,
        },
        timeline,
      };
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
    const normalizedSessionCode = sessionCode.trim();

    const session = await prisma.classSession.findFirst({
      where: {
        sessionCode: {
          equals: normalizedSessionCode,
          mode: "insensitive",
        },
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
