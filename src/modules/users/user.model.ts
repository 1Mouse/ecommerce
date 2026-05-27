import { Schema, model } from "mongoose";
import type { HydratedDocument, Types } from "mongoose";

export type UserPersistence = {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserDocument = HydratedDocument<UserPersistence> & {
  _id: Types.ObjectId;
};

const userSchema = new Schema<UserPersistence>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 320,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = model<UserPersistence>("User", userSchema);
