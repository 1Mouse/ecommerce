import type { Response } from "express";

export type ApiSuccessResponse<T> = {
  data: T;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiPaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export function sendSuccess<T>(
  response: Response,
  data: T,
  statusCode = 200,
): void {
  response.status(statusCode).json({
    data,
  } satisfies ApiSuccessResponse<T>);
}

export function sendPaginated<T>(
  response: Response,
  data: T[],
  pagination: PaginationMeta,
  statusCode = 200,
): void {
  response.status(statusCode).json({
    data,
    pagination,
  } satisfies ApiPaginatedResponse<T>);
}
