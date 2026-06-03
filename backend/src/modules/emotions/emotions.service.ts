import { AttentionLevel, EmotionType } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AnalyzeStudentFrameDto, CreateEmotionLogDto } from "./emotions.dto";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/socket.events";
import { AppError } from "../../common/middleware/error.middleware";
import { HTTP_STATUS } from "../../common/constants";
import { env } from "../../config/env";

interface AiStudentAnalysis {
  presence: "present" | "absent";
  status: "focused" | "unfocused" | "normal" | "absent";
  emotion: string;
  emotionLabel: string;
  emotionSource?: string;
  eyeState?: unknown;
  attentionLabel: string;
  attentionLevel?: "HIGH" | "MEDIUM" | "LOW";
  attentionSource?: string;
  attentionConfidence?: number | null;
  isFocused: boolean;
  confidence: number;
  reason: string;
  landmarkCount: number;
  headPose?: unknown;
  faceBox?: unknown;
  landmarks?: unknown;
  blendshapes?: unknown;
  emotionScores?: Record<string, number>;
  presenceGuarded?: boolean;
}

const mapEmotionToDb = (emotion: string): EmotionType => {
  const normalized = emotion.trim().toLowerCase();

  if (normalized === "happy") return EmotionType.HAPPY;
  if (normalized === "sad" || normalized === "sleepy") return EmotionType.SAD;
  if (normalized === "angry") return EmotionType.ANGRY;
  if (normalized === "surprise" || normalized === "surprised")
    return EmotionType.SURPRISED;
  if (normalized === "fear" || normalized === "fearful")
    return EmotionType.FEARFUL;
  if (normalized === "disgust" || normalized === "disgusted")
    return EmotionType.DISGUSTED;

  return EmotionType.NEUTRAL;
};

const mapAttentionToDb = (
  attentionLevel: AiStudentAnalysis["attentionLevel"],
  status: AiStudentAnalysis["status"],
): AttentionLevel => {
  if (attentionLevel) return AttentionLevel[attentionLevel];
  if (status === "focused") return AttentionLevel.HIGH;
  if (status === "unfocused" || status === "absent") return AttentionLevel.LOW;
  return AttentionLevel.MEDIUM;
};

const callAiService = async (
  payload: AnalyzeStudentFrameDto & { sessionId: string; studentId: string },
): Promise<AiStudentAnalysis> => {
  const aiUrl = env.AI_SERVICE_URL.replace(/\/$/, "");
  const fallbackUrl = aiUrl.includes("localhost")
    ? aiUrl.replace("localhost", "127.0.0.1")
    : null;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const requestInit: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    };

    let response: Response;
    try {
      response = await fetch(`${aiUrl}/analyze-student-frame`, requestInit);
    } catch (error) {
      if (!fallbackUrl || fallbackUrl === aiUrl) throw error;
      response = await fetch(
        `${fallbackUrl}/analyze-student-frame`,
        requestInit,
      );
    }

    if (!response.ok) {
      throw new AppError(
        `AI service failed with status ${response.status}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return (await response.json()) as AiStudentAnalysis;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const emotionsService = {
  analyzeStudentFrame: async (
    sessionId: string,
    studentId: string,
    payload: AnalyzeStudentFrameDto,
  ) => {
    const participant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        studentId,
        joinStatus: "APPROVED",
        session: { status: "ACTIVE" },
      },
      include: {
        student: { select: { id: true, fullName: true } },
        session: { include: { class: true } },
      },
    });

    if (!participant) {
      throw new AppError(
        "Participant not found or session is not active",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const analysis = await callAiService({
      ...payload,
      sessionId,
      studentId,
    });

    const log = await prisma.emotionLog.create({
      data: {
        participantId: participant.id,
        emotion: mapEmotionToDb(analysis.emotion),
        confidence: Number.isFinite(analysis.confidence)
          ? Math.max(0, Math.min(1, analysis.confidence))
          : 0,
        attentionLevel: mapAttentionToDb(
          analysis.attentionLevel,
          analysis.status,
        ),
      },
    });

    const realtimePayload = {
      sessionId,
      participantId: participant.id,
      studentId: participant.student.id,
      studentName: participant.student.fullName,
      recordedAt: log.recordedAt,
      emotion: log.emotion,
      attentionLevel: log.attentionLevel,
      confidence: log.confidence,
      analysis,
    };

    getIO()
      .to(`teacher:${participant.session.class.teacherId}`)
      .emit(SOCKET_EVENTS.EMOTION_UPDATE, realtimePayload);

    return realtimePayload;
  },

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
