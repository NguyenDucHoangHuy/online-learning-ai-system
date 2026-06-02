// src/modules/participants/participants.service.ts
import { JoinStatus, SessionStatus } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { HTTP_STATUS, MESSAGES } from "../../common/constants";
import { AppError } from "../../common/middleware/error.middleware";

// 🛰️ NẠP HẠ TẦNG ĐIỀU PHỐI SOCKET REAL-TIME THEO ĐÚNG ĐƯỜNG DẪN PROJECT
import { getIO } from "../../sockets/socket.server";
import { emitToStudent, emitToTeacher } from "../../sockets/utils/emit.util";
import { SOCKET_EVENTS } from "../../sockets/socket.events";

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
    // 🎯 TỐI ƯU: Include thêm thông tin class để bốc ra teacherId phục vụ bắn Socket sau đó
    const session = await prisma.classSession.findFirst({
      where: {
        id: sessionId,
        status: {
          in: [SessionStatus.WAITING, SessionStatus.ACTIVE],
        },
      },
      include: {
        class: {
          select: {
            teacherId: true,
          },
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

    let participantRecord;

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
      participantRecord = await prisma.sessionParticipant.update({
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
        include: {
          student: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
    } else {
      participantRecord = await prisma.sessionParticipant.create({
        data: {
          sessionId,
          studentId,
          joinStatus: session.requireApproval
            ? JoinStatus.PENDING
            : JoinStatus.APPROVED,
          joinedAt: session.requireApproval ? null : new Date(),
        },
        include: {
          student: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });
    }

    // 📡 MẮT XÍCH BƯỚC 3.5: Nếu trạng thái là PENDING, bắn ngay tin nhắn báo danh lên phòng riêng của Giáo viên
    if (participantRecord.joinStatus === JoinStatus.PENDING) {
      try {
        const io = getIO();
        emitToTeacher(
          io,
          session.class.teacherId,
          SOCKET_EVENTS.PARTICIPANT_JOINED,
          {
            id: participantRecord.id,
            sessionId: participantRecord.sessionId,
            studentId: participantRecord.studentId,
            joinStatus: participantRecord.joinStatus,
            student: participantRecord.student,
          },
        );
      } catch (socketErr) {
        console.error(
          "⚠️ [Socket Engine] Không thể notify sự kiện participant:joined cho giáo viên:",
          socketErr,
        );
      }
    }

    return participantRecord;
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

    const updatedParticipant = await prisma.sessionParticipant.update({
      where: {
        id: participantId,
      },
      data: {
        joinStatus: JoinStatus.APPROVED,
        joinedAt: new Date(),
      },
    });

    // 📡 MẮT XÍCH BƯỚC 3.3: Gõ cửa phòng riêng sinh viên báo tin vui APPROVED để kích hoạt chuyển trang realtime
    try {
      const io = getIO();
      emitToStudent(
        io,
        updatedParticipant.studentId,
        SOCKET_EVENTS.PARTICIPANT_APPROVED,
        {
          sessionId: updatedParticipant.sessionId,
        },
      );
    } catch (socketErr) {
      console.error(
        "⚠️ [Socket Engine] Gặp lỗi khi emit sự kiện approved sang sinh viên:",
        socketErr,
      );
    }

    return updatedParticipant;
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

    const updatedParticipant = await prisma.sessionParticipant.update({
      where: {
        id: participantId,
      },
      data: {
        joinStatus: JoinStatus.REJECTED,
      },
    });

    // 📡 MẮT XÍCH BƯỚC 3.3: Bắn tin REJECTED trực tiếp cho Sinh viên để ép văng khỏi radar phòng chờ
    try {
      const io = getIO();
      emitToStudent(
        io,
        updatedParticipant.studentId,
        SOCKET_EVENTS.PARTICIPANT_REJECTED,
        {
          sessionId: updatedParticipant.sessionId,
        },
      );
    } catch (socketErr) {
      console.error(
        "⚠️ [Socket Engine] Gặp lỗi khi emit sự kiện rejected sang sinh viên:",
        socketErr,
      );
    }

    return updatedParticipant;
  },

  leaveSession: async (participantId: string, studentId: string) => {
    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        id: participantId,
        studentId,
      },
      include: {
        session: {
          include: {
            class: { select: { teacherId: true } },
          },
        },
      },
    });

    if (!participant) {
      throw new AppError(MESSAGES.PARTICIPANT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // =======================================================================
    // 🎯 ĐÃ VÁ GUARD STATE: Chấp nhận cả APPROVED (Rời phòng) và PENDING (Hủy sảnh chờ)
    // =======================================================================
    const allowedStatuses: JoinStatus[] = [
      JoinStatus.APPROVED,
      JoinStatus.PENDING,
    ];

    if (!allowedStatuses.includes(participant.joinStatus)) {
      throw new AppError(
        "Chỉ có thể rời phòng hoặc hủy yêu cầu khi đang ở trạng thái APPROVED hoặc PENDING.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    // Thực hiện lệnh ghi đè cập nhật mốc thời gian rời đi dứt khoát dưới Database
    const updatedParticipant = await prisma.sessionParticipant.update({
      where: {
        id: participantId,
      },
      data: {
        joinStatus: JoinStatus.LEFT,
        leftAt: new Date(),
      },
    });

    // 📡 MẮT XÍCH BỔ TRỢ: Báo tin cho Giáo viên biết Sinh viên đã rút lui khỏi lớp/hàng chờ
    try {
      const io = getIO();
      emitToTeacher(
        io,
        participant.session.class.teacherId,
        SOCKET_EVENTS.PARTICIPANT_LEFT,
        {
          userId: studentId,
          role: "STUDENT",
          leftAt: updatedParticipant.leftAt?.toISOString(),
        },
      );
    } catch (socketErr) {
      console.error(
        "⚠️ [Socket Engine] Gặp lỗi khi emit sự kiện left sang giáo viên:",
        socketErr,
      );
    }

    return updatedParticipant;
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

    // 🎯 THU THẬP DANH SÁCH: Quét lấy mảng studentId đang xếp hàng PENDING trước khi dội bom update hàng loạt
    const pendingStudents = await prisma.sessionParticipant.findMany({
      where: {
        sessionId,
        joinStatus: JoinStatus.PENDING,
      },
      select: {
        studentId: true,
      },
    });

    // 2. Chạy lệnh update hàng loạt (Bulk Update) những sinh viên đang PENDING dưới DB
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

    // 📡 MẮT XÍCH BƯỚC 3.3: Quét qua danh sách mảng Sinh viên vừa lấy để dội bom lệnh APPROVED đồng loạt thời gian thực
    if (pendingStudents.length > 0) {
      try {
        const io = getIO();
        pendingStudents.forEach((record) => {
          emitToStudent(
            io,
            record.studentId,
            SOCKET_EVENTS.PARTICIPANT_APPROVED,
            {
              sessionId,
            },
          );
        });
      } catch (socketErr) {
        console.error(
          "⚠️ [Socket Engine] Lỗi dội bom lệnh approve-all thời gian thực:",
          socketErr,
        );
      }
    }

    return updateResult; // Trả về số lượng bản ghi đã được cập nhật { count: X }
  },
};
