export type AppErrorOptions = {
  statusCode?: number;
  code?: string;
  details?: unknown;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational = true;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_SERVER_ERROR";
    this.details = options.details;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, {
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, {
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, {
      statusCode: 409,
      code: "CONFLICT",
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, {
      statusCode: 404,
      code: "NOT_FOUND",
    });
  }
}
