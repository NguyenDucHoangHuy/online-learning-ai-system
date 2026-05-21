import { AttentionLevel } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { CreateEmotionLogDto } from "./emotions.dto";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/socket.events";
import { AppError } from "../../common/middleware/error.middleware";
import { HTTP_STATUS } from "../../common/constants";

export const emotionsService = {
  createLog: async (data: CreateEmotionLogDto) => {
    const participant = await prisma.sessionParticipant.findUnique({
      where: { id: data.participantId },
      include: {
        student: true,
        session: { include: { class: true } },
      },
    });

    if (!participant) {
      // ✅ Đồng bộ hóa Error Handling bằng AppError toàn hệ thống
      throw new AppError("Participant not found", HTTP_STATUS.NOT_FOUND);
    }

    const log = await prisma.emotionLog.create({ data });

    // Emit tín hiệu nhẹ nhàng cho phòng riêng của Giáo viên
    getIO()
      .to(`teacher:${participant.session.class.teacherId}`)
      .emit(SOCKET_EVENTS.EMOTION_UPDATE, {
        participantId: participant.id,
        studentId: participant.student.id,
        studentName: participant.student.fullName,
        emotion: log.emotion,
        attentionLevel: log.attentionLevel,
        confidence: log.confidence,
        recordedAt: log.recordedAt,
      });

    return log;
  },

  getRealtimeSnapshot: async (sessionId: string) => {
    const participants = await prisma.sessionParticipant.findMany({
      where: { sessionId, joinStatus: "APPROVED" },
      include: {
        student: { select: { id: true, fullName: true } },
        emotionLogs: {
          orderBy: { recordedAt: "desc" },
          take: 1, // Kỹ thuật bốc log mới nhất siêu đỉnh của bạn
        },
      },
    });

    return participants.map((p) => ({
      participantId: p.id,
      studentId: p.student.id,
      studentName: p.student.fullName,
      latestEmotion: p.emotionLogs[0] ?? null,
    }));
  },

  // ✅ VÁ LỖI HIỆU NĂNG: Giao việc đếm cho DB xử lý qua câu lệnh count() siêu tốc
  getSessionReport: async (sessionId: string) => {
    // Chạy song song 2 câu lệnh đếm dữ liệu bằng Promise.all để tối ưu thời gian phản hồi
    const [totalLogs, lowAttentionCount] = await Promise.all([
      prisma.emotionLog.count({
        where: { participant: { sessionId } },
      }),
      prisma.emotionLog.count({
        where: {
          participant: { sessionId },
          attentionLevel: AttentionLevel.LOW,
        },
      }),
    ]);

    const total = totalLogs || 1;
    const averageAttention = ((total - lowAttentionCount) / total) * 100;

    return {
      totalLogs,
      averageAttention: Math.round(averageAttention * 100) / 100, // Làm tròn 2 chữ số thập phân cho đẹp UI
    };
  },

  getParticipantLogs: async (participantId: string) => {
    return prisma.emotionLog.findMany({
      where: { participantId },
      orderBy: { recordedAt: "desc" },
      take: 100, // Khuyến nghị: Giới hạn số lượng log hiển thị hoặc thêm phân trang về sau
    });
  },

  getMyLogs: async (sessionId: string, studentId: string) => {
    const participant = await prisma.sessionParticipant.findFirst({
      where: { sessionId, studentId },
    });

    if (!participant) return [];

    return prisma.emotionLog.findMany({
      where: { participantId: participant.id },
      orderBy: { recordedAt: "desc" },
      take: 100, // Giới hạn an toàn tránh tải quá nặng
    });
  },
};
