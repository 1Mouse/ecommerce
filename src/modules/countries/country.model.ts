import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

export type CountryDocument = {
  iso2: string;
  iso3: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

const countrySchema = new Schema<CountryDocument>(
  {
    iso2: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2,
    },
    iso3: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    collection: "countries",
    timestamps: true,
  },
);

export const CountryModel =
  models.Country ?? model<CountryDocument>("Country", countrySchema);
