import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";

import { MongoBaseCrudRepository } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import type { PaginatedResult, PaginationInput } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import { UserAddressModel } from "./user-address.model.ts";
import type { UserAddressDocument } from "./user-address.model.ts";

const { Types } = mongoose;

export type UserAddress = {
  id: string;
  userId: string;
  countryId: string;
  label: string | null;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateUserAddressInput = {
  userId: string;
  countryId: string;
  label?: string | null;
  city: string;
  postalCode: string;
  line1: string;
  line2?: string | null;
};

export type UpdateUserAddressInput = Partial<
  Omit<CreateUserAddressInput, "userId">
>;

export class UserAddressRepository extends MongoBaseCrudRepository<
  UserAddressDocument,
  UserAddress
> {
  constructor() {
    super(UserAddressModel);
  }

  protected toEntity(document: HydratedDocument<UserAddressDocument>): UserAddress {
    return {
      id: document._id.toString(),
      userId: document.userId.toString(),
      countryId: document.countryId.toString(),
      label: document.label,
      city: document.city,
      postalCode: document.postalCode,
      line1: document.line1,
      line2: document.line2,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  async createAddress(input: CreateUserAddressInput): Promise<UserAddress> {
    return this.create({
      userId: new Types.ObjectId(input.userId),
      countryId: new Types.ObjectId(input.countryId),
      label: input.label ?? null,
      city: input.city,
      postalCode: input.postalCode,
      line1: input.line1,
      line2: input.line2 ?? null,
      deletedAt: null,
    } as Partial<UserAddressDocument>);
  }

  async findByUserId(
    userId: string,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<UserAddress>> {
    return this.findMany(
      { userId: new Types.ObjectId(userId) },
      pagination,
    );
  }

  async findOwnedById(userId: string, addressId: string): Promise<UserAddress | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) {
      return null;
    }

    const document = await UserAddressModel.findOne({
      _id: new Types.ObjectId(addressId),
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();

    return document ? this.toEntity(document) : null;
  }

  async updateOwnedById(
    userId: string,
    addressId: string,
    input: UpdateUserAddressInput,
  ): Promise<UserAddress | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) {
      return null;
    }

    const update: Partial<UserAddressDocument> = {
      ...(input.countryId === undefined
        ? {}
        : { countryId: new Types.ObjectId(input.countryId) }),
      ...(input.label === undefined ? {} : { label: input.label }),
      ...(input.city === undefined ? {} : { city: input.city }),
      ...(input.postalCode === undefined ? {} : { postalCode: input.postalCode }),
      ...(input.line1 === undefined ? {} : { line1: input.line1 }),
      ...(input.line2 === undefined ? {} : { line2: input.line2 }),
    };

    const document = await UserAddressModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(addressId),
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      },
      { $set: update },
      { returnDocument: "after", runValidators: true },
    ).exec();

    return document ? this.toEntity(document) : null;
  }

  async softDeleteOwnedById(
    userId: string,
    addressId: string,
  ): Promise<UserAddress | null> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) {
      return null;
    }

    const document = await UserAddressModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(addressId),
        userId: new Types.ObjectId(userId),
        deletedAt: null,
      },
      { $set: { deletedAt: new Date() } },
      { returnDocument: "after", runValidators: true },
    ).exec();

    return document ? this.toEntity(document) : null;
  }
}
