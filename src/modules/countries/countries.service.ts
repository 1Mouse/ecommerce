import { ConflictError, NotFoundError, UnprocessableEntityError } from "../../shared/errors/app-error.ts";
import type { PaginatedResult, PaginationInput } from "../../infrastructure/database/mongodb/mongo-base-crud.repository.ts";
import type { Country, CountryRepository, CreateCountryInput } from "./country.repository.ts";

export class CountriesService {
  private readonly countries: CountryRepository;

  constructor(countries: CountryRepository) {
    this.countries = countries;
  }

  async listCountries(pagination: PaginationInput): Promise<PaginatedResult<Country>> {
    return this.countries.findMany({}, pagination);
  }

  async getCountryById(countryId: string): Promise<Country> {
    const country = await this.countries.findById(countryId);

    if (!country) {
      throw new NotFoundError("Country not found", "COUNTRY_NOT_FOUND");
    }

    return country;
  }

  async ensureActiveCountry(countryId: string): Promise<Country> {
    const country = await this.countries.findById(countryId);

    if (!country) {
      throw new UnprocessableEntityError(
        "Invalid country id",
        "INVALID_COUNTRY_ID",
      );
    }

    return country;
  }

  async createCountry(input: CreateCountryInput): Promise<Country> {
    const normalized = this.normalizeCountry(input);
    const [sameIso2, sameIso3, sameName] = await Promise.all([
      this.countries.findByIso2(normalized.iso2),
      this.countries.findByIso3(normalized.iso3),
      this.countries.findByName(normalized.name),
    ]);

    if (sameIso2 || sameIso3 || sameName) {
      throw new ConflictError("Country already exists", "COUNTRY_ALREADY_EXISTS");
    }

    return this.countries.create({
      ...normalized,
      deletedAt: null,
    });
  }

  async updateCountry(
    countryId: string,
    input: Partial<CreateCountryInput>,
  ): Promise<Country> {
    const country = await this.countries.updateById(countryId, this.normalizeCountryPatch(input));

    if (!country) {
      throw new NotFoundError("Country not found", "COUNTRY_NOT_FOUND");
    }

    return country;
  }

  async softDeleteCountry(countryId: string): Promise<Country> {
    const country = await this.countries.softDeleteById(countryId);

    if (!country) {
      throw new NotFoundError("Country not found", "COUNTRY_NOT_FOUND");
    }

    return country;
  }

  async seedCountries(inputs: CreateCountryInput[]): Promise<Country[]> {
    const countries: Country[] = [];

    for (const input of inputs) {
      countries.push(await this.countries.upsertByIso2(this.normalizeCountry(input)));
    }

    return countries;
  }

  private normalizeCountry(input: CreateCountryInput): CreateCountryInput {
    return {
      iso2: input.iso2.trim().toUpperCase(),
      iso3: input.iso3.trim().toUpperCase(),
      name: input.name.trim(),
    };
  }

  private normalizeCountryPatch(
    input: Partial<CreateCountryInput>,
  ): Partial<CreateCountryInput> {
    return {
      ...(input.iso2 === undefined ? {} : { iso2: input.iso2.trim().toUpperCase() }),
      ...(input.iso3 === undefined ? {} : { iso3: input.iso3.trim().toUpperCase() }),
      ...(input.name === undefined ? {} : { name: input.name.trim() }),
    };
  }
}
