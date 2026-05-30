import { defineRoute } from "../../shared/http/define-route.ts";
import { paginationQuerySchema } from "../../shared/http/pagination.ts";
import { countryIdParamsSchema } from "./countries.schema.ts";

export const countriesManifest = {
  listCountries: defineRoute({
    name: "countries.listCountries",
    brunoVar: "countriesListPath",
    version: "v1",
    method: "get",
    path: "/api/v1/countries",
    auth: "public",
    querySchema: paginationQuerySchema,
  }),
  getCountryById: defineRoute({
    name: "countries.getCountryById",
    brunoVar: "countriesGetByIdPath",
    version: "v1",
    method: "get",
    path: "/api/v1/countries/:countryId",
    auth: "public",
    paramsSchema: countryIdParamsSchema,
  }),
} as const;
