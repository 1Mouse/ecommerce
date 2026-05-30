import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export type UserDocument = {
  email: string;
  username: string;
  passwordHash: string;
  imageExt: string | null;
  phone: string | null;
  dob: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    imageExt: {
      type: String,
      default: null,
      enum: ["jpg", "jpeg", "png", "webp", null],
    },
    phone: {
      type: String,
      default: null,
      maxlength: 20,
    },
    dob: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "users",
    timestamps: true,
  },
);

export const UserModel = models.User ?? model<UserDocument>("User", userSchema);
