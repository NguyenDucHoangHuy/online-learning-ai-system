import { Router } from "express";
import { chatController } from "./chat.controller";
import { chatValidation } from "./chat.validation";
import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get(
  "/sessions/:sessionId/messages",
  chatValidation.getMessages,
  chatController.getMessages,
);

// Fallback endpoint only.
// Main realtime flow uses Socket.IO.
router.post(
  "/sessions/:sessionId/messages",
  chatValidation.sendMessage,
  chatController.sendMessage,
);

export default router;
