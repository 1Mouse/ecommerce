import { buildRoutePath } from "../../src/shared/http/define-route.ts";
import type { RouteDefinition } from "../../src/shared/http/define-route.ts";

type JsonBody = Record<string, unknown> | null;

export type ApiResponse<T = unknown> = {
  status: number;
  body: T;
};

export async function requestJson<T = unknown>(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    body?: JsonBody;
    accessToken?: string;
  } = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { "content-type": "application/json" }),
      ...(options.accessToken === undefined
        ? {}
        : { authorization: `Bearer ${options.accessToken}` }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as T) : (undefined as T);

  return {
    status: response.status,
    body,
  };
}

export async function requestRoute<T = unknown>(
  baseUrl: string,
  route: RouteDefinition,
  options: {
    body?: JsonBody;
    accessToken?: string;
    params?: Record<string, string>;
    query?: Record<string, string | number | boolean | null | undefined>;
  } = {},
): Promise<ApiResponse<T>> {
  return requestJson<T>(
    baseUrl,
    route.method.toUpperCase(),
    buildRoutePath(route.path, options.params, options.query),
    {
      body: options.body,
      accessToken: options.accessToken,
    },
  );
}

export function uniqueUser(prefix = "user"): {
  email: string;
  username: string;
  password: string;
} {
  const value = `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return {
    email: `${prefix}-${value}@example.com`,
    username: `${prefix}_${value}`.replace(/[^a-z0-9_]/gi, "_").slice(0, 30),
    password: "password123",
  };
}
