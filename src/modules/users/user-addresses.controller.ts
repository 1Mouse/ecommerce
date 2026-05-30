import type { Request, Response } from "express";

import { UnauthorizedError } from "../../shared/errors/app-error.ts";
import { sendPaginated, sendSuccess } from "../../shared/http/api-response.ts";
import type { PaginationQuery } from "../../shared/http/pagination.ts";
import type {
  AddressIdParams,
  CreateAddressBody,
  UpdateAddressBody,
} from "./user-addresses.schema.ts";
import type { UserAddressesService } from "./user-addresses.service.ts";

export class UserAddressesController {
  private readonly userAddressesService: UserAddressesService;

  constructor(userAddressesService: UserAddressesService) {
    this.userAddressesService = userAddressesService;
  }

  async listMyAddresses(request: Request, response: Response): Promise<void> {
    const query = request.validatedQuery as PaginationQuery;
    const result = await this.userAddressesService.listMyAddresses(
      this.getUserId(request),
      query,
    );

    sendPaginated(response, result.data, result.pagination);
  }

  async getMyAddress(request: Request, response: Response): Promise<void> {
    const { addressId } = request.params as AddressIdParams;
    const address = await this.userAddressesService.getMyAddress(
      this.getUserId(request),
      addressId,
    );

    sendSuccess(response, address);
  }

  async createMyAddress(request: Request, response: Response): Promise<void> {
    const body = request.body as CreateAddressBody;
    const address = await this.userAddressesService.createMyAddress(
      this.getUserId(request),
      body,
    );

    sendSuccess(response, address, 201);
  }

  async updateMyAddress(request: Request, response: Response): Promise<void> {
    const { addressId } = request.params as AddressIdParams;
    const body = request.body as UpdateAddressBody;
    const address = await this.userAddressesService.updateMyAddress(
      this.getUserId(request),
      addressId,
      body,
    );

    sendSuccess(response, address);
  }

  async deleteMyAddress(request: Request, response: Response): Promise<void> {
    const { addressId } = request.params as AddressIdParams;
    const result = await this.userAddressesService.deleteMyAddress(
      this.getUserId(request),
      addressId,
    );

    sendSuccess(response, result);
  }

  private getUserId(request: Request): string {
    if (!request.auth?.userId) {
      throw new UnauthorizedError();
    }

    return request.auth.userId;
  }
}
