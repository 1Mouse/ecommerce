import { z } from "zod";

import { objectIdSchema } from "../../shared/http/common-schemas.ts";

export const addressIdParamsSchema = z
  .object({
    addressId: objectIdSchema,
  })
  .strip();

export const createAddressBodySchema = z
  .object({
    countryId: objectIdSchema,
    label: z.string().trim().max(50).nullable().optional(),
    city: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(1).max(20),
    line1: z.string().trim().min(1).max(200),
    line2: z.string().trim().max(200).nullable().optional(),
  })
  .strip();

export const updateAddressBodySchema = createAddressBodySchema.partial().strip();

export type AddressIdParams = z.infer<typeof addressIdParamsSchema>;
export type CreateAddressBody = z.infer<typeof createAddressBodySchema>;
export type UpdateAddressBody = z.infer<typeof updateAddressBodySchema>;
