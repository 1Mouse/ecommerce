import type { Request, Response } from "express";

import { UnauthorizedError } from "../../shared/errors/app-error.ts";
import { sendSuccess } from "../../shared/http/api-response.ts";
import type { UpdateMeBody } from "./users.schema.ts";
import type { UsersService } from "./users.service.ts";

export class UsersController {
  private readonly usersService: UsersService;

  constructor(usersService: UsersService) {
    this.usersService = usersService;
  }

  async getMe(request: Request, response: Response): Promise<void> {
    const user = await this.usersService.getMe(this.getUserId(request));
    sendSuccess(response, user);
  }

  async updateMe(request: Request, response: Response): Promise<void> {
    const body = request.body as UpdateMeBody;
    const user = await this.usersService.updateMe(this.getUserId(request), {
      ...(body.username === undefined ? {} : { username: body.username }),
      ...(body.phone === undefined ? {} : { phone: body.phone }),
      ...(body.dob === undefined
        ? {}
        : { dob: body.dob === null ? null : new Date(body.dob) }),
    });

    sendSuccess(response, user);
  }

  async deleteMe(request: Request, response: Response): Promise<void> {
    const result = await this.usersService.deleteMe(this.getUserId(request));
    sendSuccess(response, result);
  }

  private getUserId(request: Request): string {
    if (!request.auth?.userId) {
      throw new UnauthorizedError();
    }

    return request.auth.userId;
  }
}
