import { Router } from "express";

import { emotionsController } from "./emotions.controller";

import { emotionsValidation } from "./emotions.validation";

import { authenticate } from "../../common/middleware/auth.middleware";

import { requireApiKey } from "../../common/middleware/api-key.middleware";

const router = Router();

router.post(
  "/emotions/log",
  requireApiKey,
  emotionsValidation.createLog,
  emotionsController.createLog,
);

router.get(
  "/sessions/:sessionId/emotions/realtime",
  authenticate,
  emotionsValidation.realtime,
  emotionsController.getRealtime,
);

router.get(
  "/sessions/:sessionId/emotions/report",
  authenticate,
  emotionsController.getSessionReport,
);

router.get(
  "/participants/:participantId/emotions",
  authenticate,
  emotionsController.getParticipantLogs,
);

router.get(
  "/sessions/:sessionId/emotions/my",
  authenticate,
  emotionsController.getMyLogs,
);

export default router;
