import { Router } from "express";

import { asyncHandler } from "../../shared/http/async-handler.ts";
import { validateParams, validateQuery } from "../../shared/http/validation.ts";
import type { CountriesController } from "./countries.controller.ts";
import { countriesManifest } from "./countries.manifest.ts";

export function createCountriesRouter(controller: CountriesController): Router {
  const router = Router();

  router.get(
    countriesManifest.listCountries.path,
    validateQuery(countriesManifest.listCountries.querySchema),
    asyncHandler((request, response) => controller.listCountries(request, response)),
  );

  router.get(
    countriesManifest.getCountryById.path,
    validateParams(countriesManifest.getCountryById.paramsSchema),
    asyncHandler((request, response) => controller.getCountryById(request, response)),
  );

  return router;
}
