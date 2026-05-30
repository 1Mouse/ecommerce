import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/ecommerce"),
  JWT_ACCESS_TOKEN_SECRET: z
    .string()
    .min(32)
    .default("dev-access-token-secret-change-me-123456"),
  JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60),
  JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 24 * 60 * 60),
  PASSWORD_HASH_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:3000"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

const rawEnv = parsedEnv.data;

if (
  rawEnv.NODE_ENV === "production" &&
  rawEnv.JWT_ACCESS_TOKEN_SECRET.includes("change-me")
) {
  throw new Error("Production JWT access token secret must be configured explicitly");
}

const corsOrigins =
  rawEnv.CORS_ORIGINS === "*"
    ? true
    : rawEnv.CORS_ORIGINS.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  port: rawEnv.PORT,
  mongodbUri: rawEnv.MONGODB_URI,
  jwtAccessTokenSecret: rawEnv.JWT_ACCESS_TOKEN_SECRET,
  jwtAccessTokenExpiresInSeconds: rawEnv.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  jwtRefreshTokenExpiresInSeconds: rawEnv.JWT_REFRESH_TOKEN_EXPIRES_IN_SECONDS,
  passwordHashRounds: rawEnv.PASSWORD_HASH_ROUNDS,
  corsOrigins,
} as const;
