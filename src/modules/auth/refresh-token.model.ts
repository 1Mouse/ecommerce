import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export type RefreshTokenDocument = {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    replacedByTokenId: {
      type: Schema.Types.ObjectId,
      default: null,
      ref: "RefreshToken",
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "refreshTokens",
    timestamps: true,
  },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel =
  models.RefreshToken ??
  model<RefreshTokenDocument>("RefreshToken", refreshTokenSchema);
