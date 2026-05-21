import { Role } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";
import { SendMessageDto, GetMessagesQueryDto } from "./chat.dto";
import { Prisma } from "@prisma/client";

// Định nghĩa type tại service, export để handler dùng
export type ChatMessageWithUser = Prisma.ChatMessageGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        fullName: true;
        role: true;
      };
    };
  };
}>;

// Helper: verify user có quyền truy cập session
const verifySessionAccess = async (
  sessionId: string,
  userId: string,
  role: Role,
) => {
  if (role === Role.TEACHER) {
    const session = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        class: { teacherId: userId },
      },
    });

    if (!session) {
      throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    return session;
  }

  // Student phải là APPROVED participant
  const participant = await prisma.sessionParticipant.findFirst({
    where: {
      sessionId,
      studentId: userId,
      joinStatus: "APPROVED",
    },
    include: {
      session: true,
    },
  });

  if (!participant) {
    throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  return participant.session;
};

export const chatService = {
  // REST API — chỉ dùng để load lịch sử chat khi mới vào phòng
  getMessages: async (
    sessionId: string,
    userId: string,
    role: Role,
    query: GetMessagesQueryDto,
  ) => {
    await verifySessionAccess(sessionId, userId, role);

    const { limit, before } = query;

    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
      },

      take: limit + 1,

      skip: before ? 1 : 0,

      cursor: before
        ? {
            id: before,
          }
        : undefined,

      orderBy: {
        sentAt: "desc",
      },

      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    const nextCursor = hasMore ? messages[messages.length - 1].id : null;

    return {
      messages: [...messages].reverse(),

      pagination: {
        limit,
        hasMore,
        nextCursor,
      },
    };
  },

  // Dùng cho Socket handler — chỉ lưu DB, không verify session status
  // Việc verify session ACTIVE và quyền truy cập do Socket handler lo trước khi gọi hàm này
  sendMessage: async (
    sessionId: string,
    userId: string,
    data: SendMessageDto,
  ): Promise<ChatMessageWithUser> => {
    return prisma.chatMessage.create({
      data: {
        sessionId,
        userId,
        message: data.message,
      },
      include: {
        user: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });
  },
};
