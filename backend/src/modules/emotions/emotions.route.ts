import { Router } from "express";
import { emotionsController } from "./emotions.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.post("/log", emotionsController.logAiEmotion);
router.get("/stats/:sessionId", emotionsController.getSessionStats);

export default router;
