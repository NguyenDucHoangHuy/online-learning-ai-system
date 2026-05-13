import { Router } from "express";

import { usersController } from "./users.controller";

import { usersValidation } from "./users.validation";

import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.patch(
  "/profile",
  usersValidation.updateProfile,
  usersController.updateProfile,
);

export default router;
