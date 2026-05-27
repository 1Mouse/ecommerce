import type { Response } from "express";

export type ApiSuccessResponse<T> = {
  status: "success";
  data: T;
};

export function sendSuccess<T>(
  response: Response,
  data: T,
  statusCode = 200,
): void {
  response.status(statusCode).json({
    status: "success",
    data,
  } satisfies ApiSuccessResponse<T>);
}
