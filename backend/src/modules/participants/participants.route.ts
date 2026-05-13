import { Router } from "express";
import { Role } from "@prisma/client";
import { participantsController } from "./participants.controller";
import { participantsValidation } from "./participants.validation";
import { authenticate, authorize } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

// Sinh viên join session
router.post("/join", authorize([Role.STUDENT]), participantsValidation.joinSession, participantsController.joinSession);

// Giảng viên quản lý danh sách tham gia
router.get("/pending/:sessionId", authorize([Role.TEACHER]), participantsController.getPending);
router.patch("/status/:participantId", authorize([Role.TEACHER]), participantsValidation.updateStatus, participantsController.updateStatus);

export default router;