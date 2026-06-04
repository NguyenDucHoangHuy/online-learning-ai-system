import { AttentionLevel, EmotionType, JoinStatus, Role } from "@prisma/client";
import { prisma } from "../../prisma/client";
import { AnalyzeStudentFrameDto, CreateEmotionLogDto } from "./emotions.dto";
import { getIO } from "../../sockets/socket.server";
import { SOCKET_EVENTS } from "../../sockets/socket.events";
import { AppError } from "../../common/middleware/error.middleware";
import { HTTP_STATUS } from "../../common/constants";
import { env } from "../../config/env";

const ATTENTION_SCORE: Record<AttentionLevel, number> = {
  [AttentionLevel.HIGH]: 100,
  [AttentionLevel.MEDIUM]: 70,
  [AttentionLevel.LOW]: 0,
};

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const buildTimeline = (
  logs: Array<{ recordedAt: Date; attentionLevel: AttentionLevel }>,
  firstLogAt: Date | null,
) => {
  const timelineBuckets = new Map<
    number,
    {
      bucketMinute: number;
      values: number[];
      highCount: number;
      mediumCount: number;
      lowCount: number;
      logCount: number;
    }
  >();

  if (!firstLogAt) return [];

  logs.forEach((log) => {
    const elapsedMs = log.recordedAt.getTime() - firstLogAt.getTime();
    const bucketMinute = Math.max(
      0,
      Math.floor(elapsedMs / (5 * 60 * 1000)) * 5,
    );
    const current = timelineBuckets.get(bucketMinute) ?? {
      bucketMinute,
      values: [],
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      logCount: 0,
    };

    current.values.push(ATTENTION_SCORE[log.attentionLevel]);
    current.logCount += 1;
    if (log.attentionLevel === AttentionLevel.HIGH) current.highCount += 1;
    if (log.attentionLevel === AttentionLevel.MEDIUM)
      current.mediumCount += 1;
    if (log.attentionLevel === AttentionLevel.LOW) current.lowCount += 1;

    timelineBuckets.set(bucketMinute, current);
  });

  return Array.from(timelineBuckets.values())
    .sort((a, b) => a.bucketMinute - b.bucketMinute)
    .map((bucket) => ({
      minute: bucket.bucketMinute,
      averageAttention: round(
        bucket.values.reduce((sum, value) => sum + value, 0) /
          bucket.values.length,
      ),
      logCount: bucket.logCount,
      highCount: bucket.highCount,
      mediumCount: bucket.mediumCount,
      lowCount: bucket.lowCount,
    }));
};

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
  getSessionReport: async (
    sessionId: string,
    requester?: { id: string; role: Role },
  ) => {
    const session = await prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            teacherId: true,
          },
        },
        participants: {
          where: {
            OR: [
              { joinStatus: { in: [JoinStatus.APPROVED, JoinStatus.LEFT] } },
              { emotionLogs: { some: {} } },
            ],
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
              orderBy: { recordedAt: "asc" },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError("Session not found", HTTP_STATUS.NOT_FOUND);
    }

    if (requester?.role === Role.TEACHER && session.class.teacherId !== requester.id) {
      throw new AppError("You do not have access to this report", HTTP_STATUS.FORBIDDEN);
    }

    if (
      requester?.role === Role.STUDENT &&
      !session.participants.some((participant) => participant.studentId === requester.id)
    ) {
      throw new AppError("You do not have access to this report", HTTP_STATUS.FORBIDDEN);
    }

    const logs = session.participants.flatMap((participant) =>
      participant.emotionLogs.map((log) => ({
        ...log,
        participantId: participant.id,
      })),
    );

    const totalLogs = logs.length;
    const lowAttentionCount = logs.filter(
      (log) => log.attentionLevel === AttentionLevel.LOW,
    ).length;
    const focusedLogs = logs.filter(
      (log) => log.attentionLevel !== AttentionLevel.LOW,
    ).length;
    const highAttentionCount = logs.filter(
      (log) => log.attentionLevel === AttentionLevel.HIGH,
    ).length;
    const averageAttention =
      totalLogs > 0 ? (focusedLogs / totalLogs) * 100 : 0;
    const weightedAttention =
      totalLogs > 0
        ? logs.reduce(
            (sum, log) => sum + ATTENTION_SCORE[log.attentionLevel],
            0,
          ) / totalLogs
        : 0;

    const emotionDistribution = Object.values(EmotionType).map((emotion) => {
      const count = logs.filter((log) => log.emotion === emotion).length;
      return {
        emotion,
        count,
        percentage: totalLogs > 0 ? round((count / totalLogs) * 100) : 0,
      };
    });

    const attentionDistribution = Object.values(AttentionLevel).map(
      (attentionLevel) => {
        const count = logs.filter(
          (log) => log.attentionLevel === attentionLevel,
        ).length;
        return {
          attentionLevel,
          count,
          percentage: totalLogs > 0 ? round((count / totalLogs) * 100) : 0,
        };
      },
    );

    const firstLogAt = session.startedAt ?? logs[0]?.recordedAt ?? null;
    const timeline = buildTimeline(logs, firstLogAt);

    const students = session.participants.map((participant) => {
      const participantLogs = participant.emotionLogs;
      const participantTotal = participantLogs.length;
      const participantFocused = participantLogs.filter(
        (log) => log.attentionLevel !== AttentionLevel.LOW,
      ).length;
      const participantLow = participantLogs.filter(
        (log) => log.attentionLevel === AttentionLevel.LOW,
      ).length;
      const participantWeighted =
        participantTotal > 0
          ? participantLogs.reduce(
              (sum, log) => sum + ATTENTION_SCORE[log.attentionLevel],
              0,
            ) / participantTotal
          : 0;

      const emotionCounts = Object.values(EmotionType).map((emotion) => ({
        emotion,
        count: participantLogs.filter((log) => log.emotion === emotion).length,
      }));
      const primaryEmotion = emotionCounts.reduce(
        (best, item) => (item.count > best.count ? item : best),
        { emotion: EmotionType.NEUTRAL, count: 0 },
      ).emotion;
      const latestLog = participantLogs[participantLogs.length - 1] ?? null;

      return {
        participantId: participant.id,
        studentId: participant.student.id,
        fullName: participant.student.fullName,
        email: participant.student.email,
        joinedAt: participant.joinedAt,
        leftAt: participant.leftAt,
        logCount: participantTotal,
        focusedLogCount: participantFocused,
        lowAttentionCount: participantLow,
        attentionPercentage:
          participantTotal > 0
            ? round((participantFocused / participantTotal) * 100)
            : 0,
        weightedAttention: round(participantWeighted),
        primaryEmotion,
        latestEmotion: latestLog?.emotion ?? null,
        latestAttentionLevel: latestLog?.attentionLevel ?? null,
        latestRecordedAt: latestLog?.recordedAt ?? null,
        timeline: buildTimeline(participantLogs, firstLogAt),
        logs: participantLogs.map((log, index) => ({
          index: index + 1,
          id: log.id,
          emotion: log.emotion,
          confidence: round(log.confidence * 100),
          attentionLevel: log.attentionLevel,
          attentionScore: ATTENTION_SCORE[log.attentionLevel],
          recordedAt: log.recordedAt,
          minute:
            firstLogAt !== null
              ? round((log.recordedAt.getTime() - firstLogAt.getTime()) / 60000)
              : null,
        })),
      };
    });

    return {
      session: {
        id: session.id,
        title: session.title,
        sessionCode: session.sessionCode,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
        class: session.class,
      },
      totalLogs,
      averageAttention: round(averageAttention),
      weightedAttention: round(weightedAttention),
      highAttentionCount,
      lowAttentionCount,
      participantCount: session.participants.length,
      analyzedParticipantCount: students.filter((student) => student.logCount > 0)
        .length,
      emotionDistribution,
      attentionDistribution,
      timeline,
      students,
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
