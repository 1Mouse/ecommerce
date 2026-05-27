import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { validateBody } from "../../shared/http/validation.ts";
import type { AuthController } from "./auth.controller.ts";
import { loginSchema, refreshSchema, signupSchema } from "./auth.schemas.ts";

export function createAuthRouter(authController: AuthController): Router {
  const router = Router();

  router.post(
    "/signup",
    validateBody(signupSchema),
    asyncHandler(authController.signup),
  );
  router.post(
    "/login",
    validateBody(loginSchema),
    asyncHandler(authController.login),
  );
  router.post(
    "/refresh",
    validateBody(refreshSchema),
    asyncHandler(authController.refresh),
  );

  return router;
}
