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
  EMAIL_VERIFICATION_EXPIRES_IN_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(24 * 60 * 60),
  EMAIL_VERIFICATION_URL: z
    .string()
    .url()
    .default("http://localhost:5173/verify-email"),
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(1025),
  SMTP_FROM: z.string().min(1).default("Ecommerce <no-reply@ecommerce.local>"),
  S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(3).default("ecommerce-local"),
  S3_ACCESS_KEY_ID: z.string().min(1).default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
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
  emailVerificationExpiresInSeconds: rawEnv.EMAIL_VERIFICATION_EXPIRES_IN_SECONDS,
  emailVerificationUrl: rawEnv.EMAIL_VERIFICATION_URL,
  smtpHost: rawEnv.SMTP_HOST,
  smtpPort: rawEnv.SMTP_PORT,
  smtpFrom: rawEnv.SMTP_FROM,
  s3Endpoint: rawEnv.S3_ENDPOINT,
  s3Region: rawEnv.S3_REGION,
  s3Bucket: rawEnv.S3_BUCKET,
  s3AccessKeyId: rawEnv.S3_ACCESS_KEY_ID,
  s3SecretAccessKey: rawEnv.S3_SECRET_ACCESS_KEY,
  s3ForcePathStyle: rawEnv.S3_FORCE_PATH_STYLE,
  passwordHashRounds: rawEnv.PASSWORD_HASH_ROUNDS,
  corsOrigins,
} as const;
