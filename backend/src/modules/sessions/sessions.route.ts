import { Router } from "express";
import { sessionsController } from "./sessions.controller";
import { sessionsValidation } from "./sessions.validation";
import {
  authenticate,
  authorize,
} from "../../common/middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

// Bắt buộc đăng nhập
router.use(authenticate);

// ==================== 1. STUDENT ONLY ROUTES ====================
// CHÚ Ý CỰC KỲ QUAN TRỌNG: Đặt các route cố định lên ĐẦU TIÊN
router.get(
  "/sessions/join/:sessionCode",
  authorize([Role.STUDENT]),
  sessionsController.lookupSession,
);
router.get(
  "/sessions/my-history",
  authorize([Role.STUDENT]),
  sessionsController.getMyHistory,
);

// ==================== 2. TEACHER ONLY ROUTES ====================

// 🎯 BỔ SUNG ĐẦU TIÊN CHỐT HẠ: API bốc lịch sử các buổi học gần đây nhất của riêng Giáo viên
router.get(
  "/sessions/history",
  authorize([Role.TEACHER]),
  sessionsController.getSessionHistory, // Tên hàm xử lý trong controller
);
router.get(
  "/sessions/recent",
  authorize([Role.TEACHER]),
  sessionsController.getRecentSessions,
);

// /api/classes/:classId/sessions
router.post(
  "/classes/:classId/sessions",
  authorize([Role.TEACHER]),
  sessionsValidation.createSession,
  sessionsController.createSession,
);

router.get(
  "/classes/:classId/sessions",
  authorize([Role.TEACHER]),
  sessionsController.getSessionsByClass,
);

router.patch(
  "/sessions/:sessionId/start",
  authorize([Role.TEACHER]),
  sessionsController.startSession,
);

router.patch(
  "/sessions/:sessionId/end",
  authorize([Role.TEACHER]),
  sessionsController.endSession,
);

// ==================== 3. AUTHENTICATED (CẢ 2 ĐỀU DÙNG ĐƯỢC) ====================
// CHÚ Ý: Đặt route động :sessionId ở CUỐI CÙNG để không bị chèn ép các route phía trên
router.get("/sessions/:sessionId", sessionsController.getSessionById);

export default router;
