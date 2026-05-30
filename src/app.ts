import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.ts";
import { container } from "./container.ts";
import { getMongoConnectionStatus } from "./infrastructure/database/mongodb.ts";
import { createAuthRouter } from "./modules/auth/auth.routes.ts";
import { createCountriesRouter } from "./modules/countries/countries.routes.ts";
import { createUsersRouter } from "./modules/users/users.routes.ts";
import { errorHandler, notFoundHandler } from "./shared/http/error-handler.ts";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigins,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(
  pinoHttp({
    enabled: env.nodeEnv !== "test",
  }),
);

app.get("/health", (_request, response) => {
  const database = getMongoConnectionStatus();

  response.status(database === "connected" ? 200 : 503).json({
    status: database === "connected" ? "ok" : "degraded",
    database,
  });
});

app.use(
  "/api/v1/auth",
  createAuthRouter({
    authController: container.authController,
    authMiddleware: container.authMiddleware,
  }),
);
app.use(
  "/api/v1/users",
  createUsersRouter({
    authMiddleware: container.authMiddleware,
    usersController: container.usersController,
    userAddressesController: container.userAddressesController,
  }),
);
app.use("/api/v1/countries", createCountriesRouter(container.countriesController));

app.use(notFoundHandler);
app.use(errorHandler);
