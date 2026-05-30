import { flattenRoutes } from "../shared/http/define-route.ts";
import { authManifest } from "./auth/auth.manifest.ts";
import { countriesManifest } from "./countries/countries.manifest.ts";
import { usersManifest } from "./users/users.manifest.ts";

export const routeManifests = {
  auth: authManifest,
  users: usersManifest,
  countries: countriesManifest,
} as const;

export const allRoutes = flattenRoutes([
  authManifest,
  usersManifest,
  countriesManifest,
]);
