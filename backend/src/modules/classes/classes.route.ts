import { Router } from "express";

import { Role } from "@prisma/client";

import * as classesController from "./classes.controller";

import { classesValidation } from "./classes.validation";

import {
  authenticate,
  authorize,
} from "../../common/middleware/auth.middleware";

const router = Router();

// ==================== AUTHORIZATION ====================
router.use(authenticate);

router.use(authorize([Role.TEACHER]));

// ==================== ROUTES ====================

router.get("/dashboard/stats", classesController.getDashboardStats);

router.post("/", classesValidation.createClass, classesController.createClass);

router.get("/", classesController.getMyClasses);

router.get("/:classId", classesController.getClassById);

router.patch(
  "/:classId",
  classesValidation.updateClass,
  classesController.updateClass,
);

router.delete("/:classId", classesController.deleteClass);

export default router;
