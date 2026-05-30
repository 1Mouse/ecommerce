import type { HydratedDocument } from "mongoose";

import { MongoBaseCrudRepository } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import { CountryModel } from "./country.model.ts";
import type { CountryDocument } from "./country.model.ts";

export type Country = {
  id: string;
  iso2: string;
  iso3: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type CreateCountryInput = {
  iso2: string;
  iso3: string;
  name: string;
};

export class CountryRepository extends MongoBaseCrudRepository<
  CountryDocument,
  Country
> {
  constructor() {
    super(CountryModel);
  }

  protected toEntity(document: HydratedDocument<CountryDocument>): Country {
    return {
      id: document._id.toString(),
      iso2: document.iso2,
      iso3: document.iso3,
      name: document.name,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
    };
  }

  async findByIso2(iso2: string): Promise<Country | null> {
    const document = await CountryModel.findOne({ iso2, deletedAt: null }).exec();
    return document ? this.toEntity(document) : null;
  }

  async findByIso3(iso3: string): Promise<Country | null> {
    const document = await CountryModel.findOne({ iso3, deletedAt: null }).exec();
    return document ? this.toEntity(document) : null;
  }

  async findByName(name: string): Promise<Country | null> {
    const document = await CountryModel.findOne({ name, deletedAt: null }).exec();
    return document ? this.toEntity(document) : null;
  }

  async upsertByIso2(input: CreateCountryInput): Promise<Country> {
    const document = await CountryModel.findOneAndUpdate(
      { iso2: input.iso2 },
      {
        $set: {
          iso3: input.iso3,
          name: input.name,
          deletedAt: null,
        },
        $setOnInsert: {
          iso2: input.iso2,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    ).exec();

    if (!document) {
      throw new Error("Failed to upsert country");
    }

    return this.toEntity(document);
  }
}
