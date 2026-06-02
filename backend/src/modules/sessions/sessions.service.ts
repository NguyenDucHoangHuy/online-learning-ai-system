// backend/src/modules/sessions/sessions.service.ts
import { Role, SessionStatus, JoinStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";
import { generateSessionCode } from "../../common/utils/string.util";
import { CreateSessionDto } from "./sessions.dto";
import { getIO } from "../../sockets/socket.server";
import { emitToSession } from "../../sockets/utils/emit.util";
import { SOCKET_EVENTS } from "../../sockets/socket.events";

const generateUniqueSessionCode = async (): Promise<string> => {
  const MAX_RETRIES = 5;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = generateSessionCode();
    const existing = await prisma.classSession.findUnique({
      where: { sessionCode: code },
    });
    if (!existing) return code;
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
      class: { teacherId },
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
      where: { id: classId, teacherId },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // =========================================================================
    // 🎯 TẦNG KIỂM DUYỆT KHÓA CHẶN THỜI GIAN TRẦN LỚP HỌC < 3 TIẾNG
    // =========================================================================
    const startTime = new Date(data.startedAt).getTime();
    const endTime = new Date(data.endedAt).getTime();
    const durationMs = endTime - startTime;
    const MAX_DURATION_MS = 3 * 60 * 60 * 1000; // 3 tiếng quy đổi ra Miliseconds

    if (durationMs <= 0) {
      throw new AppError(
        "Thời gian kết thúc bài học bắt buộc phải lớn hơn thời gian bắt đầu.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (durationMs > MAX_DURATION_MS) {
      throw new AppError(
        "Quán triệt: Thời lượng diễn ra một buổi học trực tuyến không được phép vượt quá 3 tiếng.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    // =========================================================================

    const sessionCode = await generateUniqueSessionCode();

    const session = await prisma.classSession.create({
      data: {
        classId,
        title: data.title,
        requireApproval: data.requireApproval,
        sessionCode,
        status: SessionStatus.WAITING,
        startedAt: new Date(data.startedAt), // Găm trường lịch trình chuẩn Date
        endedAt: new Date(data.endedAt), // Găm trường lịch trình chuẩn Date
      },
    });

    return session;
  },

  getSessionsByClass: async (classId: string, teacherId: string) => {
    const existingClass = await prisma.class.findFirst({
      where: { id: classId, teacherId },
    });

    if (!existingClass) {
      throw new AppError(MESSAGES.CLASS_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return prisma.classSession.findMany({
      where: { classId },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  getSessionById: async (sessionId: string, userId: string, role: Role) => {
    const currentTime = new Date();

    // 👨‍🏫 KỊCH BẢN LUỒNG: GIÁO VIÊN TRUY CẬP PHÒNG DẠY
    if (role === Role.TEACHER) {
      let session = await prisma.classSession.findFirst({
        where: {
          id: sessionId,
          class: { teacherId: userId },
        },
        include: {
          class: true,
          _count: { select: { participants: true, chatMessages: true } },
        },
      });

      if (!session) {
        throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
      }

      // 🧠 BỘ NẮN DÒNG TRẠNG THÁI LAZY SYNC CHO GIÁO VIÊN (BẢN VÁ AN TOÀN CHỐT HẠ)
      // Chỉ chạy so sánh nếu startedAt và endedAt dưới DB thực sự tồn tại (khác null)
      if (session.startedAt && session.endedAt) {
        const startTime = session.startedAt;
        const endTime = session.endedAt;

        if (
          session.status === SessionStatus.WAITING &&
          currentTime >= startTime &&
          currentTime < endTime
        ) {
          session = await prisma.classSession.update({
            where: { id: sessionId },
            data: { status: SessionStatus.ACTIVE },
            include: {
              class: true,
              _count: { select: { participants: true, chatMessages: true } },
            },
          });
        } else if (
          (session.status === SessionStatus.ACTIVE ||
            session.status === SessionStatus.WAITING) &&
          currentTime >= endTime
        ) {
          session = await prisma.classSession.update({
            where: { id: sessionId },
            data: { status: SessionStatus.ENDED, endedAt: endTime },
            include: {
              class: true,
              _count: { select: { participants: true, chatMessages: true } },
            },
          });
        }
      }

      return session;
    }

    // 🧑‍🎓 KỊCH BẢN LUỒNG: HỌC SINH TRUY CẬP PHÒNG HỌC
    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        studentId: userId,
        joinStatus: { in: [JoinStatus.APPROVED, JoinStatus.PENDING] },
      },
      include: {
        session: { include: { class: true } },
      },
    });

    if (!participant) {
      throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }

    // 🧠 BỘ NẮN DÒNG TRẠNG THÁI LAZY SYNC CHO HỌC SINH (BẢN VÁ AN TOÀN CHỐT HẠ)
    const nestedSession = participant.session;
    let finalSessionObj = nestedSession;

    if (nestedSession.startedAt && nestedSession.endedAt) {
      const startTime = nestedSession.startedAt;
      const endTime = nestedSession.endedAt;

      if (
        nestedSession.status === SessionStatus.WAITING &&
        currentTime >= startTime &&
        currentTime < endTime
      ) {
        finalSessionObj = await prisma.classSession.update({
          where: { id: nestedSession.id },
          data: { status: SessionStatus.ACTIVE },
          include: { class: true },
        });
      } else if (
        (nestedSession.status === SessionStatus.ACTIVE ||
          nestedSession.status === SessionStatus.WAITING) &&
        currentTime >= endTime
      ) {
        finalSessionObj = await prisma.classSession.update({
          where: { id: nestedSession.id },
          data: { status: SessionStatus.ENDED, endedAt: endTime },
          include: { class: true },
        });
      }
    }

    return finalSessionObj;
  },

  startSession: async (sessionId: string, teacherId: string) => {
    const session = await findOwnedSession(sessionId, teacherId);

    if (session.status !== SessionStatus.WAITING) {
      throw new AppError(
        "Can only start the lesson from the WAITING state",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    return prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ACTIVE,
        startedAt: new Date(), // Ghi nhận mốc thời gian phát sóng thực tế
      },
    });
  },

  endSession: async (
    sessionId: string,
    teacherId: string,
    endedBy?: "TEACHER" | "SYSTEM",
  ) => {
    let session = await findOwnedSession(sessionId, teacherId);
    const currentTime = new Date();

    // 🎯 THẦN CHÚ LAZY VALIDATION ĐẬP TAN BUG 400 (BẢN VÁ AN TOÀN CHỐT HẠ)
    if (
      session.status === SessionStatus.WAITING &&
      session.startedAt &&
      currentTime >= session.startedAt
    ) {
      console.log(
        `⚡ [Lazy Validation End] Ép nắn dòng trạng thái phòng ${sessionId} (WAITING → ACTIVE)`,
      );
      session = await prisma.classSession.update({
        where: { id: sessionId },
        data: { status: SessionStatus.ACTIVE },
      });
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new AppError(
        "Can only end the lesson from the ACTIVE state",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const endedSession = await prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ENDED,
        endedAt: currentTime, // Đồng bộ ghi nhận mốc thời gian đóng hòm thực tế
      },
    });

    try {
      emitToSession(getIO(), sessionId, SOCKET_EVENTS.SESSION_ENDED, {
        sessionId,
        message: "Buổi học đã kết thúc.",
        endedBy: endedBy || "TEACHER",
      });
    } catch (error) {
      console.warn("⚠️ [Session Ended] Failed to emit realtime event:", error);
    }

    return endedSession;
  },

  lookupSession: async (sessionCode: string) => {
    // 🎯 CHUẨN HÓA CHUỖI NHẬP VÀO: Bỏ khoảng trắng dư thừa và dọn sạch dấu gạch ngang nếu có
    const rawCode = sessionCode.trim();
    const strippedCode = rawCode.replace(/-/g, "").toUpperCase();

    console.log(
      `\n🔍 [Debug Lookup] ---------------------------------------------`,
    );
    console.log(
      `🔍 [Debug Lookup] Học sinh gửi lên: "${rawCode}" -> Chuỗi thô: "${strippedCode}"`,
    );

    // 1. 🎯 SỬA CHỐT: Bỏ điều kiện lọc status để cho phép quét trúng các session đã ENDED dưới DB
    const session = await prisma.classSession.findFirst({
      where: {
        OR: [
          { sessionCode: rawCode }, // Khớp tuyệt đối có dấu gạch (e.g. "CDF-DEVK-BDI")
          { sessionCode: strippedCode }, // Khớp tuyệt đối mã thô không dấu (e.g. "CDFDEVKBDI")
          { sessionCode: rawCode.toLowerCase() }, // Phòng hờ chữ thường
        ],
      },
    });

    // Kịch bản 1: Không tìm thấy bất kỳ session nào tồn tại dưới DB -> Báo 404 chuẩn chỉ
    if (!session) {
      console.log(
        `❌ [Debug Lookup] THẤT BẠI: Mã phòng học hoàn toàn không tồn tại.`,
      );
      throw new AppError(
        "Mã phòng học không tồn tại trên hệ thống. Vui lòng kiểm tra lại!",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    // Kịch bản 2: Phòng học có tồn tại nhưng trạng thái vốn dĩ dưới DB đã đóng hòm từ trước
    if (session.status === SessionStatus.ENDED) {
      console.log(
        `❌ [Debug Lookup] THẤT BẠI: Phòng học tồn tại nhưng trạng thái đã ENDED từ trước.`,
      );
      throw new AppError(
        "Buổi học thuộc mã CODE này đã kết thúc thời gian giảng dạy.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // 🧠 BỘ NẮN TRẠNG THÁI TỰ ĐỘNG KHI TRA CỨU CODE (LAZY VALIDATION)
    const currentTime = new Date();
    let needUpdate = false;
    let computedStatus: SessionStatus = session.status;
    if (session.startedAt && session.endedAt) {
      const startTime = session.startedAt;
      const endTime = session.endedAt;

      if (
        session.status === SessionStatus.WAITING &&
        currentTime >= startTime &&
        currentTime < endTime
      ) {
        computedStatus = SessionStatus.ACTIVE;
        needUpdate = true;
      } else if (currentTime >= endTime) {
        // 🚨 PHÁT HIỆN LỌT LƯỚI THỜI GIAN: Hết giờ trần lịch trình trôi qua
        computedStatus = SessionStatus.ENDED;
        needUpdate = true;
      }
    }

    if (needUpdate) {
      console.log(
        `⚡ [Lazy Validation Lookup] Ép nắn dòng trạng thái phòng sang: ${computedStatus}`,
      );
      await prisma.classSession.update({
        where: { id: session.id },
        data: {
          status: computedStatus,
          endedAt:
            computedStatus === SessionStatus.ENDED
              ? session.endedAt
              : undefined,
        },
      });

      // Kịch bản 3: Do cơ chế lười đồng bộ, học sinh tra cứu phát hiện quá giờ -> Ép nắn sang ENDED và chặn đứng luôn
      if (computedStatus === SessionStatus.ENDED) {
        throw new AppError(
          "Buổi học thuộc mã CODE này vừa kết thúc thời gian giảng dạy.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }
    }

    // Kịch bản 4: Phòng học hoàn toàn hợp pháp và đang diễn ra (ACTIVE hoặc WAITING trong giờ)
    const finalSession = await prisma.classSession.findFirst({
      where: { id: session.id },
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

    if (!finalSession) {
      throw new AppError(MESSAGES.SESSION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    console.log(
      `🟢 [Debug Lookup] THÀNH CÔNG! Đẩy data phòng về cho Học sinh bấu kết nối.`,
    );
    return finalSession;
  },

  getMyHistory: async (studentId: string) => {
    return prisma.sessionParticipant.findMany({
      where: { studentId },
      include: {
        session: { include: { class: true } },
      },
      orderBy: [{ joinedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    });
  },

  // 🎯 BỔ SUNG HÀM CUỐI CÙNG: Bốc lịch sử buổi học gần đây của Giáo viên
  getRecentSessions: async (teacherId: string) => {
    return prisma.classSession.findMany({
      where: {
        class: {
          teacherId, // Chỉ lấy các buổi học nằm trong lớp của Giáo viên này
        },
      },
      orderBy: {
        createdAt: "desc", // Buổi học nào vừa tạo/diễn ra xong xếp lên ĐẦU TIÊN
      },
      take: 5, // Khóa chặt chỉ bốc tối đa 5 bản ghi tươi mới nhất để render UI
    });
  },
  getSessionHistory: async (teacherId: string) => {
    return prisma.classSession.findMany({
      where: {
        class: {
          teacherId, // Gắp các buổi học nằm trong lớp của Giáo viên này
        },
      },
      include: {
        class: {
          select: {
            id: true, // 🎯 ĐÃ CHỈNH: Chỉ bốc các trường thực tế có trong DB
            name: true, // 🎯 ĐÃ CHỈNH: Giữ lại trường name hợp pháp
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Xếp buổi học mới nhất lên đầu danh sách
      },
    });
  },
};
