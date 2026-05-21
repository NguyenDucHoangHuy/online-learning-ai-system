import { z } from "zod";
import { JoinStatus } from "@prisma/client";

export const getParticipantsQuerySchema = z.object({
  status: z.nativeEnum(JoinStatus).optional(),
});
