import type { ZodType } from "zod";

export type RouteMethod = "get" | "post" | "patch" | "put" | "delete";
export type RouteAuth = "public" | "required";
export type RouteVersion = "v1";

export type RouteDefinition = {
  name: string;
  brunoVar: string;
  version: RouteVersion;
  method: RouteMethod;
  path: string;
  auth: RouteAuth;
  bodySchema?: ZodType;
  paramsSchema?: ZodType;
  querySchema?: ZodType;
};

export function defineRoute<const TRoute extends RouteDefinition>(
  route: TRoute,
): Readonly<TRoute> {
  return route;
}

export function buildRoutePath(
  path: string,
  params: Record<string, string> = {},
  query: Record<string, string | number | boolean | null | undefined> = {},
): string {
  let builtPath = path;

  for (const [key, value] of Object.entries(params)) {
    builtPath = builtPath.replace(`:${key}`, encodeURIComponent(value));
  }

  const queryParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      queryParams.set(key, String(value));
    }
  }

  const queryString = queryParams.toString();

  return queryString ? `${builtPath}?${queryString}` : builtPath;
}

export function flattenRoutes(
  routeGroups: Array<Record<string, RouteDefinition>>,
): RouteDefinition[] {
  return routeGroups.flatMap((group) => Object.values(group));
}
