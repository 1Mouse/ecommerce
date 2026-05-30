import { z } from "zod";

import { objectIdSchema } from "../../shared/http/common-schemas.ts";

export const countryIdParamsSchema = z
  .object({
    countryId: objectIdSchema,
  })
  .strip();

export const countryInputSchema = z
  .object({
    iso2: z.string().trim().length(2).transform((value) => value.toUpperCase()),
    iso3: z.string().trim().length(3).transform((value) => value.toUpperCase()),
    name: z.string().trim().min(1).max(100),
  })
  .strip();

export type CountryIdParams = z.infer<typeof countryIdParamsSchema>;
export type CountryInput = z.infer<typeof countryInputSchema>;
