import type { Request, Response } from "express";

import { sendPaginated, sendSuccess } from "../../shared/http/api-response.ts";
import type { PaginationQuery } from "../../shared/http/pagination.ts";
import type { CountryIdParams } from "./countries.schema.ts";
import type { CountriesService } from "./countries.service.ts";

export class CountriesController {
  private readonly countriesService: CountriesService;

  constructor(countriesService: CountriesService) {
    this.countriesService = countriesService;
  }

  async listCountries(request: Request, response: Response): Promise<void> {
    const query = request.validatedQuery as PaginationQuery;
    const result = await this.countriesService.listCountries(query);

    sendPaginated(response, result.data, result.pagination);
  }

  async getCountryById(request: Request, response: Response): Promise<void> {
    const { countryId } = request.params as CountryIdParams;
    const country = await this.countriesService.getCountryById(countryId);

    sendSuccess(response, country);
  }
}
