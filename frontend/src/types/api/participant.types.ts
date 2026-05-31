// src/types/api/participant.types.ts
import { JoinStatus } from "./session.types";

export interface ParticipantItem {
  id: string;
  sessionId: string;
  studentId: string;
  joinStatus: JoinStatus | "LEFT";
  joinedAt: string | null;
  leftAt: string | null;
  attemptNumber: number;
  student?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface JoinParticipantResponse {
  success: boolean;
  data: ParticipantItem; // Backend trả về trực tiếp row vừa tạo/update của Prisma
}

export interface SessionParticipantsResponse {
  success: boolean;
  data: ParticipantItem[];
}
