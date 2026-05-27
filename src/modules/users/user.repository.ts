import { isValidObjectId } from "mongoose";

import { ConflictError } from "../../shared/errors/app-error.ts";
import { UserModel } from "./user.model.ts";
import type { UserDocument } from "./user.model.ts";
import { mapUserDocument } from "./user.mapper.ts";
import type {
  CreateUserRecord,
  UserRecord,
  UserRepository,
} from "./user.types.ts";

type MongoDuplicateKeyError = {
  code?: number;
};

export class MongoUserRepository implements UserRepository {
  private readonly userModel: typeof UserModel;

  constructor(userModel: typeof UserModel = UserModel) {
    this.userModel = userModel;
  }

  async create(input: CreateUserRecord): Promise<UserRecord> {
    try {
      const user = await this.userModel.create(input);
      return mapUserDocument(user as UserDocument);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("Email is already registered");
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user === null ? null : mapUserDocument(user as UserDocument);
  }

  async findByEmailWithPasswordHash(
    email: string,
  ): Promise<UserRecord | null> {
    const user = await this.userModel
      .findOne({ email })
      .select("+passwordHash")
      .exec();

    return user === null ? null : mapUserDocument(user as UserDocument);
  }

  async findById(id: string): Promise<UserRecord | null> {
    if (!isValidObjectId(id)) {
      return null;
    }

    const user = await this.userModel.findById(id).exec();
    return user === null ? null : mapUserDocument(user as UserDocument);
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as MongoDuplicateKeyError).code === 11000
  );
}
