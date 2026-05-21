import { Router } from "express";

import * as authController from "./auth.controller";

import { authenticate } from "../../common/middleware/auth.middleware";
import { authValidation } from "./auth.validation";

const router = Router();

router.post("/register", authValidation.register, authController.register);

router.post("/login", authValidation.login, authController.login);

router.post("/refresh", authValidation.refresh, authController.refresh);

router.post("/logout", authValidation.logout, authController.logout);

router.get("/me", authenticate, authController.me);

export default router;
