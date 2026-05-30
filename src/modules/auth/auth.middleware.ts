import type { RequestHandler } from "express";

import { UnauthorizedError } from "../../shared/errors/app-error.ts";
import type { TokenService } from "./token.service.ts";

export class AuthMiddleware {
  readonly requireAuth: RequestHandler;

  constructor(tokenService: TokenService) {
    this.requireAuth = (request, _response, next) => {
      const authorizationHeader = request.header("authorization");

      if (!authorizationHeader?.startsWith("Bearer ")) {
        next(new UnauthorizedError("Missing access token", "MISSING_ACCESS_TOKEN"));
        return;
      }

      const accessToken = authorizationHeader.slice("Bearer ".length).trim();

      if (!accessToken) {
        next(new UnauthorizedError("Missing access token", "MISSING_ACCESS_TOKEN"));
        return;
      }

      void tokenService
        .verifyAccessToken(accessToken)
        .then((userId) => {
          request.auth = { userId };
          next();
        })
        .catch(next);
    };
  }
}
