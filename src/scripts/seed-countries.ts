import { env } from "../config/env.ts";
import { connectMongo, disconnectMongo } from "../infrastructure/database/mongodb.ts";
import { CountryRepository } from "../modules/countries/country.repository.ts";
import { CountriesService } from "../modules/countries/countries.service.ts";

const countriesService = new CountriesService(new CountryRepository());

await connectMongo(env.mongodbUri);

try {
  const countries = await countriesService.seedCountries([
    { iso2: "EG", iso3: "EGY", name: "Egypt" },
    { iso2: "US", iso3: "USA", name: "United States" },
  ]);

  console.log(`Seeded ${countries.length} countries`);
} finally {
  await disconnectMongo();
}
