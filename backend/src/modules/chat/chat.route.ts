import { Router } from "express";
import { chatController } from "./chat.controller";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);
router.post("/send", chatController.sendMessage);
router.get("/history/:sessionId", chatController.getMessages);

export default router;
