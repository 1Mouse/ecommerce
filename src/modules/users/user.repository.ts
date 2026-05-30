import type { HydratedDocument } from "mongoose";

import { MongoBaseCrudRepository } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import { UserModel } from "./user.model.ts";
import type { UserDocument } from "./user.model.ts";

export type User = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  emailVerifiedAt: Date | null;
  imageExt: string | null;
  phone: string | null;
  dob: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type PublicUser = Omit<User, "passwordHash" | "deletedAt">;

export type CreateUserInput = {
  email: string;
  username: string;
  passwordHash: string;
};

export type UpdateUserInput = {
  username?: string;
  phone?: string | null;
  dob?: Date | null;
};

type FindUserOptions = {
  includeDeleted?: boolean;
};

export class UserRepository extends MongoBaseCrudRepository<UserDocument, User> {
  constructor() {
    super(UserModel);
  }

  protected toEntity(document: HydratedDocument<UserDocument>): User {
    return {
      id: document._id.toString(),
      email: document.email,
      username: document.username,
      passwordHash: document.passwordHash,
      emailVerifiedAt: document.emailVerifiedAt,
      imageExt: document.imageExt,
      phone: document.phone,
      dob: document.dob,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  async findByEmail(
    email: string,
    options: FindUserOptions = {},
  ): Promise<User | null> {
    const document = await UserModel.findOne({
      email,
      ...(options.includeDeleted ? {} : { deletedAt: null }),
    }).exec();
    return document ? this.toEntity(document) : null;
  }

  async findByUsername(
    username: string,
    options: FindUserOptions = {},
  ): Promise<User | null> {
    const document = await UserModel.findOne({
      username,
      ...(options.includeDeleted ? {} : { deletedAt: null }),
    }).exec();
    return document ? this.toEntity(document) : null;
  }

  async markEmailVerified(userId: string, verifiedAt = new Date()): Promise<User | null> {
    return this.updateById(userId, {
      emailVerifiedAt: verifiedAt,
    });
  }
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    emailVerifiedAt: user.emailVerifiedAt,
    imageExt: user.imageExt,
    phone: user.phone,
    dob: user.dob,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
