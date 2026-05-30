import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { validateBody } from "../../shared/http/validation.ts";
import type { AuthMiddleware } from "./auth.middleware.ts";
import type { AuthController } from "./auth.controller.ts";
import { loginBodySchema, logoutBodySchema, refreshBodySchema, signupBodySchema } from "./auth.schema.ts";

export type CreateAuthRouterInput = {
  authController: AuthController;
  authMiddleware: AuthMiddleware;
};

export function createAuthRouter(input: CreateAuthRouterInput): Router {
  const router = Router();

  router.post(
    "/signup",
    validateBody(signupBodySchema),
    asyncHandler((request, response) => input.authController.signup(request, response)),
  );

  router.post(
    "/login",
    validateBody(loginBodySchema),
    asyncHandler((request, response) => input.authController.login(request, response)),
  );

  router.post(
    "/refresh",
    validateBody(refreshBodySchema),
    asyncHandler((request, response) => input.authController.refresh(request, response)),
  );

  router.post(
    "/logout",
    validateBody(logoutBodySchema),
    asyncHandler((request, response) => input.authController.logout(request, response)),
  );

  router.post(
    "/logout-all",
    input.authMiddleware.requireAuth,
    asyncHandler((request, response) => input.authController.logoutAll(request, response)),
  );

  return router;
}
