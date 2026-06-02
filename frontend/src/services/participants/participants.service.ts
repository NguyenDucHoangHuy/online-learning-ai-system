// src/services/participants/participants.service.ts
import { api } from "../../lib/axios";
import {
  JoinParticipantResponse,
  SessionParticipantsResponse,
} from "../../types/api/participant.types";
import { JoinStatus } from "../../types/api/session.types";

export const participantsService = {
  /**
   * Học sinh gửi lệnh đăng ký ghi danh vào phòng học trực tuyến qua ID khóa chính
   */
  joinSession: async (sessionId: string): Promise<JoinParticipantResponse> => {
    return api.post(`/sessions/${sessionId}/join`);
  },

  getParticipants: async (
    sessionId: string,
    status?: JoinStatus,
  ): Promise<SessionParticipantsResponse> => {
    return api.get(`/sessions/${sessionId}/participants`, {
      params: status ? { status } : undefined,
    });
  },

  approveParticipant: async (
    participantId: string,
  ): Promise<JoinParticipantResponse> => {
    return api.patch(`/participants/${participantId}/approve`);
  },

  rejectParticipant: async (
    participantId: string,
  ): Promise<JoinParticipantResponse> => {
    return api.patch(`/participants/${participantId}/reject`);
  },
};
