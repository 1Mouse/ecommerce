import { NotFoundError } from "../../shared/errors/app-error.ts";
import type { PaginatedResult, PaginationInput } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import type { CountriesService } from "../countries/countries.service.ts";
import type {
  CreateUserAddressInput,
  UpdateUserAddressInput,
  UserAddress,
  UserAddressRepository,
} from "./user-address.repository.ts";

export class UserAddressesService {
  private readonly addresses: UserAddressRepository;
  private readonly countriesService: CountriesService;

  constructor(addresses: UserAddressRepository, countriesService: CountriesService) {
    this.addresses = addresses;
    this.countriesService = countriesService;
  }

  async listMyAddresses(
    userId: string,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<UserAddress>> {
    return this.addresses.findByUserId(userId, pagination);
  }

  async getMyAddress(userId: string, addressId: string): Promise<UserAddress> {
    const address = await this.addresses.findOwnedById(userId, addressId);

    if (!address) {
      throw new NotFoundError("Address not found", "ADDRESS_NOT_FOUND");
    }

    return address;
  }

  async createMyAddress(
    userId: string,
    input: Omit<CreateUserAddressInput, "userId">,
  ): Promise<UserAddress> {
    await this.countriesService.ensureActiveCountry(input.countryId);

    return this.addresses.createAddress({
      ...input,
      userId,
    });
  }

  async updateMyAddress(
    userId: string,
    addressId: string,
    input: UpdateUserAddressInput,
  ): Promise<UserAddress> {
    if (input.countryId !== undefined) {
      await this.countriesService.ensureActiveCountry(input.countryId);
    }

    const address = await this.addresses.updateOwnedById(userId, addressId, input);

    if (!address) {
      throw new NotFoundError("Address not found", "ADDRESS_NOT_FOUND");
    }

    return address;
  }

  async deleteMyAddress(
    userId: string,
    addressId: string,
  ): Promise<Pick<UserAddress, "id" | "deletedAt">> {
    const address = await this.addresses.softDeleteOwnedById(userId, addressId);

    if (!address) {
      throw new NotFoundError("Address not found", "ADDRESS_NOT_FOUND");
    }

    return {
      id: address.id,
      deletedAt: address.deletedAt,
    };
  }
}
