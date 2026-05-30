import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { requestJson } from "../helpers/http.ts";
import {
  connectTestDatabase,
  createTestMongoUri,
  disconnectTestDatabase,
  resetTestDatabase,
  seedTestCountries,
} from "../helpers/test-db.ts";
import { startTestServer } from "../helpers/test-server.ts";
import type { TestServer } from "../helpers/test-server.ts";

type HealthResponse = {
  status: "ok" | "degraded";
  database: string;
};

type CountryListResponse = {
  data: Array<{
    id: string;
    iso2: string;
    iso3: string;
    name: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

describe("health and countries API", () => {
  let server: TestServer;

  beforeAll(async () => {
    await connectTestDatabase(createTestMongoUri("health-countries"));
    server = await startTestServer();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await server.close();
    await disconnectTestDatabase();
  });

  it("reports that the API and database are healthy", async () => {
    const response = await requestJson<HealthResponse>(server.baseUrl, "GET", "/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      database: "connected",
    });
  });

  it("lists seeded countries with pagination metadata", async () => {
    await seedTestCountries();

    const response = await requestJson<CountryListResponse>(
      server.baseUrl,
      "GET",
      "/api/v1/countries?page=1&limit=20",
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ iso2: "EG", iso3: "EGY", name: "Egypt" }),
        expect.objectContaining({ iso2: "US", iso3: "USA", name: "United States" }),
      ]),
    );
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });
});
