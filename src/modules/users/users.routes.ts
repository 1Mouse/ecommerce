import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { validateBody, validateParams, validateQuery } from "../../shared/http/validation.ts";
import type { AuthMiddleware } from "../auth/auth.middleware.ts";
import type { UserAddressesController } from "./user-addresses.controller.ts";
import type { UsersController } from "./users.controller.ts";
import { usersManifest } from "./users.manifest.ts";

export type CreateUsersRouterInput = {
  authMiddleware: AuthMiddleware;
  usersController: UsersController;
  userAddressesController: UserAddressesController;
};

export function createUsersRouter(input: CreateUsersRouterInput): Router {
  const router = Router();
  const requireAuth = input.authMiddleware.requireAuth;

  router.get(
    usersManifest.getMe.path,
    requireAuth,
    asyncHandler((request, response) => input.usersController.getMe(request, response)),
  );

  router.patch(
    usersManifest.updateMe.path,
    requireAuth,
    validateBody(usersManifest.updateMe.bodySchema),
    asyncHandler((request, response) => input.usersController.updateMe(request, response)),
  );

  router.delete(
    usersManifest.deleteMe.path,
    requireAuth,
    asyncHandler((request, response) => input.usersController.deleteMe(request, response)),
  );

  router.get(
    usersManifest.listMyAddresses.path,
    requireAuth,
    validateQuery(usersManifest.listMyAddresses.querySchema),
    asyncHandler((request, response) =>
      input.userAddressesController.listMyAddresses(request, response),
    ),
  );

  router.post(
    usersManifest.createMyAddress.path,
    requireAuth,
    validateBody(usersManifest.createMyAddress.bodySchema),
    asyncHandler((request, response) =>
      input.userAddressesController.createMyAddress(request, response),
    ),
  );

  router.get(
    usersManifest.getMyAddress.path,
    requireAuth,
    validateParams(usersManifest.getMyAddress.paramsSchema),
    asyncHandler((request, response) =>
      input.userAddressesController.getMyAddress(request, response),
    ),
  );

  router.patch(
    usersManifest.updateMyAddress.path,
    requireAuth,
    validateParams(usersManifest.updateMyAddress.paramsSchema),
    validateBody(usersManifest.updateMyAddress.bodySchema),
    asyncHandler((request, response) =>
      input.userAddressesController.updateMyAddress(request, response),
    ),
  );

  router.delete(
    usersManifest.deleteMyAddress.path,
    requireAuth,
    validateParams(usersManifest.deleteMyAddress.paramsSchema),
    asyncHandler((request, response) =>
      input.userAddressesController.deleteMyAddress(request, response),
    ),
  );

  return router;
}
