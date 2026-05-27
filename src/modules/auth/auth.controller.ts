import type { Request, Response } from "express";

import { sendSuccess } from "../../shared/http/api-response.ts";
import type { AuthService } from "./auth.service.ts";
import type { LoginInput, RefreshInput, SignupInput } from "./auth.types.ts";

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  signup = async (request: Request, response: Response): Promise<void> => {
    const session = await this.authService.signup(request.body as SignupInput);
    sendSuccess(response, session, 201);
  };

  login = async (request: Request, response: Response): Promise<void> => {
    const session = await this.authService.login(request.body as LoginInput);
    sendSuccess(response, session);
  };

  refresh = async (request: Request, response: Response): Promise<void> => {
    const session = await this.authService.refresh(request.body as RefreshInput);
    sendSuccess(response, session);
  };
}
