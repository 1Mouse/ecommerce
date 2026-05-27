import { Schema, Types, model } from "mongoose";
import type { HydratedDocument } from "mongoose";

export type RefreshTokenPersistence = {
  userId: Types.ObjectId;
  tokenHash: string;
  jti: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type RefreshTokenDocument = HydratedDocument<RefreshTokenPersistence> & {
  _id: Types.ObjectId;
};

const refreshTokenSchema = new Schema<RefreshTokenPersistence>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<RefreshTokenPersistence>(
  "RefreshToken",
  refreshTokenSchema,
);
