import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z.string().min(8).max(72);
const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/);

export const signupBodySchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
  })
  .strip();

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strip();

export const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(32).max(500),
  })
  .strip();

export const logoutBodySchema = refreshBodySchema;

export const resendVerificationEmailBodySchema = z
  .object({
    email: emailSchema,
  })
  .strip();

export const verifyEmailBodySchema = z
  .object({
    token: z.string().min(32).max(500),
  })
  .strip();

export type SignupBody = z.infer<typeof signupBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type ResendVerificationEmailBody = z.infer<
  typeof resendVerificationEmailBodySchema
>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
