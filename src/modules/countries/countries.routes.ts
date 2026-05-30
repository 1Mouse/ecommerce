import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { paginationQuerySchema } from "../../shared/http/pagination.ts";
import { validateParams, validateQuery } from "../../shared/http/validation.ts";
import type { CountriesController } from "./countries.controller.ts";
import { countryIdParamsSchema } from "./countries.schema.ts";

export function createCountriesRouter(controller: CountriesController): Router {
  const router = Router();

  router.get(
    "/",
    validateQuery(paginationQuerySchema),
    asyncHandler((request, response) => controller.listCountries(request, response)),
  );

  router.get(
    "/:countryId",
    validateParams(countryIdParamsSchema),
    asyncHandler((request, response) => controller.getCountryById(request, response)),
  );

  return router;
}
