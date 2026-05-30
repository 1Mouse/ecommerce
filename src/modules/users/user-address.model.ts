import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export type UserAddressDocument = {
  userId: mongoose.Types.ObjectId;
  countryId: mongoose.Types.ObjectId;
  label: string | null;
  city: string;
  postalCode: string;
  line1: string;
  line2: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const userAddressSchema = new Schema<UserAddressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    countryId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Country",
    },
    label: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    line1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    line2: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "userAddresses",
    timestamps: true,
  },
);

export const UserAddressModel =
  models.UserAddress ?? model<UserAddressDocument>("UserAddress", userAddressSchema);
