import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { validateBody } from "../../shared/http/validation.ts";
import type { AuthMiddleware } from "./auth.middleware.ts";
import type { AuthController } from "./auth.controller.ts";
import { authManifest } from "./auth.manifest.ts";

export type CreateAuthRouterInput = {
  authController: AuthController;
  authMiddleware: AuthMiddleware;
};

export function createAuthRouter(input: CreateAuthRouterInput): Router {
  const router = Router();

  router.post(
    authManifest.signup.path,
    validateBody(authManifest.signup.bodySchema),
    asyncHandler((request, response) => input.authController.signup(request, response)),
  );

  router.post(
    authManifest.login.path,
    validateBody(authManifest.login.bodySchema),
    asyncHandler((request, response) => input.authController.login(request, response)),
  );

  router.post(
    authManifest.refresh.path,
    validateBody(authManifest.refresh.bodySchema),
    asyncHandler((request, response) => input.authController.refresh(request, response)),
  );

  router.post(
    authManifest.logout.path,
    validateBody(authManifest.logout.bodySchema),
    asyncHandler((request, response) => input.authController.logout(request, response)),
  );

  router.post(
    authManifest.logoutAll.path,
    input.authMiddleware.requireAuth,
    asyncHandler((request, response) => input.authController.logoutAll(request, response)),
  );

  return router;
}
