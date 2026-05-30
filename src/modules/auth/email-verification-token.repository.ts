import mongoose from "mongoose";
import type { HydratedDocument } from "mongoose";

import { MongoBaseCrudRepository } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import { EmailVerificationTokenModel } from "./email-verification-token.model.ts";
import type { EmailVerificationTokenDocument } from "./email-verification-token.model.ts";

const { Types } = mongoose;

export type EmailVerificationToken = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateEmailVerificationTokenInput = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
};

export class EmailVerificationTokenRepository extends MongoBaseCrudRepository<
  EmailVerificationTokenDocument,
  EmailVerificationToken
> {
  constructor() {
    super(EmailVerificationTokenModel);
  }

  protected toEntity(
    document: HydratedDocument<EmailVerificationTokenDocument>,
  ): EmailVerificationToken {
    return {
      id: document._id.toString(),
      userId: document.userId.toString(),
      tokenHash: document.tokenHash,
      expiresAt: document.expiresAt,
      usedAt: document.usedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  async createVerificationToken(
    input: CreateEmailVerificationTokenInput,
  ): Promise<EmailVerificationToken> {
    return this.create({
      userId: new Types.ObjectId(input.userId),
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      usedAt: null,
      deletedAt: null,
    } as Partial<EmailVerificationTokenDocument>);
  }

  async findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const document = await EmailVerificationTokenModel.findOne({
      tokenHash,
      deletedAt: null,
    }).exec();

    return document ? this.toEntity(document) : null;
  }

  async markUsed(tokenId: string, usedAt = new Date()): Promise<EmailVerificationToken | null> {
    return this.updateById(tokenId, {
      usedAt,
    });
  }
}
