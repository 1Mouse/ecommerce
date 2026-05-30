import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";

import { MongoBaseCrudRepository } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import { RefreshTokenModel } from "./refresh-token.model.ts";
import type { RefreshTokenDocument } from "./refresh-token.model.ts";

const { Types } = mongoose;

export type RefreshToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateRefreshTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export class RefreshTokenRepository extends MongoBaseCrudRepository<
  RefreshTokenDocument,
  RefreshToken
> {
  constructor() {
    super(RefreshTokenModel);
  }

  protected toEntity(document: HydratedDocument<RefreshTokenDocument>): RefreshToken {
    return {
      id: document._id.toString(),
      userId: document.userId.toString(),
      tokenHash: document.tokenHash,
      expiresAt: document.expiresAt,
      revokedAt: document.revokedAt,
      replacedByTokenId: document.replacedByTokenId?.toString() ?? null,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return this.create({
      userId: new Types.ObjectId(input.userId),
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
      deletedAt: null,
    } as Partial<RefreshTokenDocument>);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const document = await RefreshTokenModel.findOne({
      tokenHash,
      deletedAt: null,
    }).exec();

    return document ? this.toEntity(document) : null;
  }

  async revokeByTokenHash(
    tokenHash: string,
    replacedByTokenId?: string,
  ): Promise<RefreshToken | null> {
    const document = await RefreshTokenModel.findOneAndUpdate(
      {
        tokenHash,
        deletedAt: null,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
          ...(replacedByTokenId === undefined
            ? {}
            : { replacedByTokenId: new Types.ObjectId(replacedByTokenId) }),
        },
      },
      { returnDocument: "after", runValidators: true },
    ).exec();

    return document ? this.toEntity(document) : null;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await RefreshTokenModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        deletedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      },
      { runValidators: true },
    ).exec();

    return result.modifiedCount;
  }
}
