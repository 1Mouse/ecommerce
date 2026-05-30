import mongoose from "mongoose";

import { connectMongo, disconnectMongo } from "../../src/infrastructure/database/mongodb.ts";
import { CountriesService } from "../../src/modules/countries/countries.service.ts";
import { CountryRepository } from "../../src/modules/countries/country.repository.ts";

export function createTestMongoUri(suiteName: string): string {
  const safeSuiteName = suiteName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `mongodb://localhost:27017/ecommerce_test_${safeSuiteName}_${Date.now()}`;
}

export async function connectTestDatabase(uri: string): Promise<void> {
  process.env.NODE_ENV = "test";
  process.env.MONGODB_URI = uri;
  await connectMongo(uri);
}

export async function resetTestDatabase(): Promise<void> {
  await mongoose.connection.dropDatabase();
}

export async function disconnectTestDatabase(): Promise<void> {
  await mongoose.connection.dropDatabase();
  await disconnectMongo();
}

export async function seedTestCountries(): Promise<void> {
  const countriesService = new CountriesService(new CountryRepository());

  await countriesService.seedCountries([
    { iso2: "EG", iso3: "EGY", name: "Egypt" },
    { iso2: "US", iso3: "USA", name: "United States" },
  ]);
}
