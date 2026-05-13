import { Router } from "express";

import { Role } from "@prisma/client";

import { classesController } from "./classes.controller";

import { classesValidation } from "./classes.validation";

import {
  authenticate,
  authorize,
} from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.use(authorize([Role.TEACHER]));

router.post("/", classesValidation.createClass, classesController.createClass);

router.get("/my", classesController.getMyClasses);

router.get("/:classId", classesController.getClassById);

router.patch(
  "/:classId",
  classesValidation.updateClass,
  classesController.updateClass,
);

router.delete("/:classId", classesController.deleteClass);

export default router;
