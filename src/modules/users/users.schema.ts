import { z } from "zod";

const e164PhoneSchema = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+[1-9]\d{1,14}$/, "Phone must use E.164 format");

const dateStringSchema = z.string().datetime({ offset: true }).or(z.string().date());

export const updateMeBodySchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_]+$/)
      .optional(),
    phone: e164PhoneSchema.nullable().optional(),
    dob: dateStringSchema.nullable().optional(),
  })
  .strip();

export type UpdateMeBody = z.infer<typeof updateMeBodySchema>;
