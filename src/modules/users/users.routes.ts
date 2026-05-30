import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { paginationQuerySchema } from "../../shared/http/pagination.ts";
import { validateBody, validateParams, validateQuery } from "../../shared/http/validation.ts";
import type { AuthMiddleware } from "../auth/auth.middleware.ts";
import type { UserAddressesController } from "./user-addresses.controller.ts";
import { addressIdParamsSchema, createAddressBodySchema, updateAddressBodySchema } from "./user-addresses.schema.ts";
import type { UsersController } from "./users.controller.ts";
import { updateMeBodySchema } from "./users.schema.ts";

export type CreateUsersRouterInput = {
  authMiddleware: AuthMiddleware;
  usersController: UsersController;
  userAddressesController: UserAddressesController;
};

export function createUsersRouter(input: CreateUsersRouterInput): Router {
  const router = Router();
  const requireAuth = input.authMiddleware.requireAuth;

  router.get(
    "/me",
    requireAuth,
    asyncHandler((request, response) => input.usersController.getMe(request, response)),
  );

  router.patch(
    "/me",
    requireAuth,
    validateBody(updateMeBodySchema),
    asyncHandler((request, response) => input.usersController.updateMe(request, response)),
  );

  router.delete(
    "/me",
    requireAuth,
    asyncHandler((request, response) => input.usersController.deleteMe(request, response)),
  );

  router.get(
    "/me/addresses",
    requireAuth,
    validateQuery(paginationQuerySchema),
    asyncHandler((request, response) =>
      input.userAddressesController.listMyAddresses(request, response),
    ),
  );

  router.post(
    "/me/addresses",
    requireAuth,
    validateBody(createAddressBodySchema),
    asyncHandler((request, response) =>
      input.userAddressesController.createMyAddress(request, response),
    ),
  );

  router.get(
    "/me/addresses/:addressId",
    requireAuth,
    validateParams(addressIdParamsSchema),
    asyncHandler((request, response) =>
      input.userAddressesController.getMyAddress(request, response),
    ),
  );

  router.patch(
    "/me/addresses/:addressId",
    requireAuth,
    validateParams(addressIdParamsSchema),
    validateBody(updateAddressBodySchema),
    asyncHandler((request, response) =>
      input.userAddressesController.updateMyAddress(request, response),
    ),
  );

  router.delete(
    "/me/addresses/:addressId",
    requireAuth,
    validateParams(addressIdParamsSchema),
    asyncHandler((request, response) =>
      input.userAddressesController.deleteMyAddress(request, response),
    ),
  );

  return router;
}
