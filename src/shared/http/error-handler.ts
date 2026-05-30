import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../../config/env.ts";
import { AppError, NotFoundError } from "../errors/app-error.ts";

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new NotFoundError(`Route ${request.method} ${request.originalUrl} not found`));
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      },
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        env.nodeEnv === "production"
          ? "Internal server error"
          : error instanceof Error
            ? error.message
            : "Unknown error",
    },
  });
};
