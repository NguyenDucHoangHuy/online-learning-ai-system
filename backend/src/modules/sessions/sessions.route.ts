import { Router } from "express";
import { Role } from "@prisma/client";
import { sessionsController } from "./sessions.controller";
import { sessionsValidation } from "./sessions.validation";
import { authenticate, authorize } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.use(authorize([Role.TEACHER]));

router.post("/", sessionsValidation.createSession, sessionsController.createSession);
router.patch("/:sessionId/end", sessionsController.endSession);

export default router;