// src/services/participants/participants.queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { participantsService } from "./participants.service";
import { JoinStatus } from "../../types/api/session.types";
import { SESSION_KEYS } from "../sessions/sessions.queries";

export const PARTICIPANT_KEYS = {
  all: ["participants"] as const,
  session: (sessionId: string, status?: JoinStatus) =>
    ["participants", sessionId, status || "ALL"] as const,
};

export const useJoinSessionRoom = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      participantsService.joinSession(sessionId),
  });
};

export const useSessionParticipants = (
  sessionId: string,
  status?: JoinStatus,
  options?: { refetchInterval?: number | false },
) => {
  return useQuery({
    queryKey: PARTICIPANT_KEYS.session(sessionId, status),
    queryFn: () => participantsService.getParticipants(sessionId, status),
    enabled: !!sessionId,
    ...options,
  });
};

export const useApproveParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
    }: {
      participantId: string;
      sessionId: string;
    }) => participantsService.approveParticipant(participantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PARTICIPANT_KEYS.session(variables.sessionId, "PENDING"),
      });
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(variables.sessionId),
      });
    },
  });
};

export const useRejectParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      participantId,
    }: {
      participantId: string;
      sessionId: string;
    }) => participantsService.rejectParticipant(participantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PARTICIPANT_KEYS.session(variables.sessionId, "PENDING"),
      });
      queryClient.invalidateQueries({
        queryKey: SESSION_KEYS.detail(variables.sessionId),
      });
    },
  });
};
