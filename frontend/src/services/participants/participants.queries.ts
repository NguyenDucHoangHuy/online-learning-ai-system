// src/services/participants/participants.queries.ts
import { useMutation } from "@tanstack/react-query";
import { participantsService } from "./participants.service";

export const useJoinSessionRoom = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      participantsService.joinSession(sessionId),
  });
};
