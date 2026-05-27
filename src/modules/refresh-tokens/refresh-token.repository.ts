import { Types, isValidObjectId } from "mongoose";

import { RefreshTokenModel } from "./refresh-token.model.ts";
import type { RefreshTokenDocument } from "./refresh-token.model.ts";
import { mapRefreshTokenDocument } from "./refresh-token.mapper.ts";
import type {
  CreateRefreshTokenRecord,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from "./refresh-token.types.ts";

export class MongoRefreshTokenRepository implements RefreshTokenRepository {
  private readonly refreshTokenModel: typeof RefreshTokenModel;

  constructor(refreshTokenModel: typeof RefreshTokenModel = RefreshTokenModel) {
    this.refreshTokenModel = refreshTokenModel;
  }

  async create(input: CreateRefreshTokenRecord): Promise<RefreshTokenRecord> {
    const refreshToken = await this.refreshTokenModel.create({
      ...input,
      userId: new Types.ObjectId(input.userId),
    });

    return mapRefreshTokenDocument(refreshToken as RefreshTokenDocument);
  }

  async findActiveByTokenHash(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null> {
    const refreshToken = await this.refreshTokenModel
      .findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
        revokedAt: { $exists: false },
      })
      .exec();

    return refreshToken === null
      ? null
      : mapRefreshTokenDocument(refreshToken as RefreshTokenDocument);
  }

  async revokeById(id: string): Promise<void> {
    if (!isValidObjectId(id)) {
      return;
    }

    await this.refreshTokenModel.updateOne(
      { _id: id, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
  }
}
