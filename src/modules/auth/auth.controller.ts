import type { Request, Response } from "express";

import { UnauthorizedError } from "../../shared/errors/app-error.ts";
import { sendSuccess } from "../../shared/http/api-response.ts";
import type { LoginBody, LogoutBody, RefreshBody, SignupBody } from "./auth.schema.ts";
import type { AuthService } from "./auth.service.ts";

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async signup(request: Request, response: Response): Promise<void> {
    const body = request.body as SignupBody;
    const result = await this.authService.signup(body);

    sendSuccess(response, result, 201);
  }

  async login(request: Request, response: Response): Promise<void> {
    const body = request.body as LoginBody;
    const result = await this.authService.login(body);

    sendSuccess(response, result);
  }

  async refresh(request: Request, response: Response): Promise<void> {
    const body = request.body as RefreshBody;
    const result = await this.authService.refresh(body.refreshToken);

    sendSuccess(response, result);
  }

  async logout(request: Request, response: Response): Promise<void> {
    const body = request.body as LogoutBody;
    const result = await this.authService.logout(body.refreshToken);

    sendSuccess(response, result);
  }

  async logoutAll(request: Request, response: Response): Promise<void> {
    if (!request.auth?.userId) {
      throw new UnauthorizedError();
    }

    const result = await this.authService.logoutAll(request.auth.userId);

    sendSuccess(response, result);
  }
}
