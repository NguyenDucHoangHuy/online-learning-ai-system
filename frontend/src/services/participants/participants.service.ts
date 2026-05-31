// src/services/participants/participants.service.ts
import { api } from "../../lib/axios";
import { JoinParticipantResponse } from "../../types/api/participant.types";

export const participantsService = {
  /**
   * Học sinh gửi lệnh đăng ký ghi danh vào phòng học trực tuyến qua ID khóa chính
   */
  joinSession: async (sessionId: string): Promise<JoinParticipantResponse> => {
    return api.post(`/sessions/${sessionId}/join`);
  },
};
