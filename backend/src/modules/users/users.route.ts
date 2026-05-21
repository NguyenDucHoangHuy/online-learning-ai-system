import { Router } from "express";

import { usersController } from "./users.controller";

import { usersValidation } from "./users.validation";

import { authenticate } from "../../common/middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/me", usersController.getMe);

router.patch(
  "/me",
  usersValidation.updateProfile,
  usersController.updateProfile,
);

router.patch(
  "/me/password",
  usersValidation.changePassword,
  usersController.changePassword,
);

export default router;
