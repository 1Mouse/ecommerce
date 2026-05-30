import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export type EmailVerificationTokenDocument = {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const emailVerificationTokenSchema = new Schema<EmailVerificationTokenDocument>(
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
    usedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "emailVerificationTokens",
    timestamps: true,
  },
);

emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationTokenModel =
  models.EmailVerificationToken ??
  model<EmailVerificationTokenDocument>(
    "EmailVerificationToken",
    emailVerificationTokenSchema,
  );
