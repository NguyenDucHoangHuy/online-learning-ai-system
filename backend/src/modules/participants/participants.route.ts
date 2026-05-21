import { Router } from "express";
import { Role } from "@prisma/client";
import { participantsValidation } from "./participants.validation";

import { participantsController } from "./participants.controller";

import {
  authenticate,
  authorize,
} from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// ================= STUDENT =================

// Join room
router.post(
  "/sessions/:sessionId/join",
  authorize([Role.STUDENT]),
  participantsController.joinSession,
);

// Leave room
router.patch(
  "/participants/:participantId/leave",
  authorize([Role.STUDENT]),
  participantsController.leaveSession,
);

// ================= TEACHER =================

// Get participants of session
router.get(
  "/sessions/:sessionId/participants",
  authorize([Role.TEACHER]),
  participantsValidation.getParticipants, // ← thêm dòng này
  participantsController.getParticipants,
);

// Duyệt TẤT CẢ học sinh đang đợi trong phòng (Đặt lên trên route động cá nhân)
router.patch(
  "/session/:sessionId/approve-all",
  authorize([Role.TEACHER]),
  participantsController.approveAllParticipants,
);

// Approve participant (Duyệt từng người)
router.patch(
  "/participants/:participantId/approve",
  authorize([Role.TEACHER]),
  participantsController.approveParticipant,
);

// Reject participant
router.patch(
  "/participants/:participantId/reject",
  authorize([Role.TEACHER]),
  participantsController.rejectParticipant,
);

export default router;
