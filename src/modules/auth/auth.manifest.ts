import { defineRoute } from "../../shared/http/define-route.ts";
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  signupBodySchema,
} from "./auth.schema.ts";

export const authManifest = {
  signup: defineRoute({
    name: "auth.signup",
    brunoVar: "authSignupPath",
    version: "v1",
    method: "post",
    path: "/api/v1/auth/signup",
    auth: "public",
    bodySchema: signupBodySchema,
  }),
  login: defineRoute({
    name: "auth.login",
    brunoVar: "authLoginPath",
    version: "v1",
    method: "post",
    path: "/api/v1/auth/login",
    auth: "public",
    bodySchema: loginBodySchema,
  }),
  refresh: defineRoute({
    name: "auth.refresh",
    brunoVar: "authRefreshPath",
    version: "v1",
    method: "post",
    path: "/api/v1/auth/refresh",
    auth: "public",
    bodySchema: refreshBodySchema,
  }),
  logout: defineRoute({
    name: "auth.logout",
    brunoVar: "authLogoutPath",
    version: "v1",
    method: "post",
    path: "/api/v1/auth/logout",
    auth: "public",
    bodySchema: logoutBodySchema,
  }),
  logoutAll: defineRoute({
    name: "auth.logoutAll",
    brunoVar: "authLogoutAllPath",
    version: "v1",
    method: "post",
    path: "/api/v1/auth/logout-all",
    auth: "required",
  }),
} as const;
