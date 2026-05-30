import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { countriesManifest } from "../../src/modules/countries/countries.manifest.ts";
import { usersManifest } from "../../src/modules/users/users.manifest.ts";
import { requestRoute, uniqueUser } from "../helpers/http.ts";
import { signupAndVerify } from "../helpers/auth.ts";
import type { AuthSuccessResponse } from "../helpers/auth.ts";
import { clearMailpitMessages } from "../helpers/mailpit.ts";
import {
  connectTestDatabase,
  createTestMongoUri,
  disconnectTestDatabase,
  resetTestDatabase,
  seedTestCountries,
} from "../helpers/test-db.ts";
import { startTestServer } from "../helpers/test-server.ts";
import type { TestServer } from "../helpers/test-server.ts";

type UserResponse = {
  data: {
    id: string;
    email: string;
    username: string;
    phone: string | null;
    dob: string | null;
  };
};

type CountryListResponse = {
  data: Array<{
    id: string;
    iso2: string;
    iso3: string;
    name: string;
  }>;
};

type AddressResponse = {
  data: {
    id: string;
    userId: string;
    countryId: string;
    label: string | null;
    city: string;
    postalCode: string;
    line1: string;
    line2: string | null;
    deletedAt: string | null;
  };
};

type AddressListResponse = {
  data: AddressResponse["data"][];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

describe("users and addresses API", () => {
  let server: TestServer;

  beforeAll(async () => {
    await connectTestDatabase(createTestMongoUri("users-addresses-flow"));
    server = await startTestServer();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await clearMailpitMessages();
    await seedTestCountries();
  });

  afterAll(async () => {
    await server.close();
    await disconnectTestDatabase();
  });

  it("lets an authenticated user read and update their current account", async () => {
    const user = uniqueUser("me");
    const signupResponse = await signup(server.baseUrl, user);
    const accessToken = signupResponse.body.data.accessToken;

    const getBeforeUpdate = await requestRoute<UserResponse>(
      server.baseUrl,
      usersManifest.getMe,
      { accessToken },
    );
    const update = await requestRoute<UserResponse>(
      server.baseUrl,
      usersManifest.updateMe,
      {
        accessToken,
        body: {
          username: `${user.username}_new`.slice(0, 30),
          phone: "+201001234567",
          dob: "1990-01-01",
          isAdmin: true,
        },
      },
    );
    const getAfterUpdate = await requestRoute<UserResponse>(
      server.baseUrl,
      usersManifest.getMe,
      { accessToken },
    );

    expect(getBeforeUpdate.status).toBe(200);
    expect(getBeforeUpdate.body.data.email).toBe(user.email);
    expect(update.status).toBe(200);
    expect(update.body.data.phone).toBe("+201001234567");
    expect(update.body.data.dob).toContain("1990-01-01");
    expect(update.body.data).not.toHaveProperty("isAdmin");
    expect(getAfterUpdate.body.data.phone).toBe("+201001234567");
  });

  it("separates request-shape validation errors from semantic user errors", async () => {
    const user = uniqueUser("user_validation");
    const signupResponse = await signup(server.baseUrl, user);
    const accessToken = signupResponse.body.data.accessToken;

    const invalidPhone = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.updateMe,
      {
        accessToken,
        body: {
          phone: "01001234567",
        },
      },
    );
    const futureDob = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.updateMe,
      {
        accessToken,
        body: {
          dob: "2999-01-01",
        },
      },
    );

    expect(invalidPhone.status).toBe(400);
    expect(invalidPhone.body.error.code).toBe("VALIDATION_ERROR");
    expect(futureDob.status).toBe(422);
    expect(futureDob.body.error.code).toBe("INVALID_DOB");
  });

  it("soft deletes the current user from normal API reads", async () => {
    const user = uniqueUser("delete_me");
    const signupResponse = await signup(server.baseUrl, user);
    const accessToken = signupResponse.body.data.accessToken;

    const deleteResponse = await requestRoute<{ data: { id: string; deletedAt: string } }>(
      server.baseUrl,
      usersManifest.deleteMe,
      { accessToken },
    );
    const getAfterDelete = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.getMe,
      { accessToken },
    );

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.id).toBe(signupResponse.body.data.user.id);
    expect(deleteResponse.body.data.deletedAt).toEqual(expect.any(String));
    expect(getAfterDelete.status).toBe(404);
    expect(getAfterDelete.body.error.code).toBe("USER_NOT_FOUND");
  });

  it("lets an authenticated user create, read, list, update, and soft delete their address", async () => {
    const user = uniqueUser("address");
    const signupResponse = await signup(server.baseUrl, user);
    const accessToken = signupResponse.body.data.accessToken;
    const countryId = await getFirstCountryId(server.baseUrl);

    const created = await createAddress(server.baseUrl, accessToken, countryId, {
      label: "home",
      city: "Cairo",
      postalCode: "11511",
      line1: "12 Tahrir Street",
      line2: "Apartment 4B",
    });
    const listed = await requestRoute<AddressListResponse>(
      server.baseUrl,
      usersManifest.listMyAddresses,
      { accessToken, query: { page: 1, limit: 20 } },
    );
    const read = await requestRoute<AddressResponse>(
      server.baseUrl,
      usersManifest.getMyAddress,
      { accessToken, params: { addressId: created.body.data.id } },
    );
    const updated = await requestRoute<AddressResponse>(
      server.baseUrl,
      usersManifest.updateMyAddress,
      {
        accessToken,
        params: { addressId: created.body.data.id },
        body: {
          label: "work",
          city: "Giza",
          postalCode: "12611",
          line1: "5 Nile Street",
          line2: null,
        },
      },
    );
    const deleted = await requestRoute<{ data: { id: string; deletedAt: string } }>(
      server.baseUrl,
      usersManifest.deleteMyAddress,
      { accessToken, params: { addressId: created.body.data.id } },
    );
    const readAfterDelete = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.getMyAddress,
      { accessToken, params: { addressId: created.body.data.id } },
    );
    const listAfterDelete = await requestRoute<AddressListResponse>(
      server.baseUrl,
      usersManifest.listMyAddresses,
      { accessToken, query: { page: 1, limit: 20 } },
    );

    expect(created.status).toBe(201);
    expect(created.body.data.userId).toBe(signupResponse.body.data.user.id);
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    expect(listed.body.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(read.status).toBe(200);
    expect(read.body.data.id).toBe(created.body.data.id);
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      label: "work",
      city: "Giza",
      postalCode: "12611",
      line1: "5 Nile Street",
      line2: null,
    });
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deletedAt).toEqual(expect.any(String));
    expect(readAfterDelete.status).toBe(404);
    expect(readAfterDelete.body.error.code).toBe("ADDRESS_NOT_FOUND");
    expect(listAfterDelete.body.data).toHaveLength(0);
  });

  it("does not let one user access another user's address", async () => {
    const owner = uniqueUser("owner");
    const stranger = uniqueUser("stranger");
    const ownerSignup = await signup(server.baseUrl, owner);
    const strangerSignup = await signup(server.baseUrl, stranger);
    const countryId = await getFirstCountryId(server.baseUrl);
    const created = await createAddress(
      server.baseUrl,
      ownerSignup.body.data.accessToken,
      countryId,
      {
        city: "Cairo",
        postalCode: "11511",
        line1: "12 Tahrir Street",
      },
    );

    const strangerRead = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.getMyAddress,
      {
        accessToken: strangerSignup.body.data.accessToken,
        params: { addressId: created.body.data.id },
      },
    );

    expect(strangerRead.status).toBe(404);
    expect(strangerRead.body.error.code).toBe("ADDRESS_NOT_FOUND");
  });

  it("returns 400 for invalid countryId shape and 422 for a missing country reference", async () => {
    const user = uniqueUser("country_validation");
    const signupResponse = await signup(server.baseUrl, user);
    const accessToken = signupResponse.body.data.accessToken;

    const invalidShape = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.createMyAddress,
      {
        accessToken,
        body: {
          countryId: "not-an-object-id",
          city: "Cairo",
          postalCode: "11511",
          line1: "12 Tahrir Street",
        },
      },
    );
    const missingCountry = await requestRoute<ErrorResponse>(
      server.baseUrl,
      usersManifest.createMyAddress,
      {
        accessToken,
        body: {
          countryId: "507f1f77bcf86cd799439011",
          city: "Cairo",
          postalCode: "11511",
          line1: "12 Tahrir Street",
        },
      },
    );

    expect(invalidShape.status).toBe(400);
    expect(invalidShape.body.error.code).toBe("VALIDATION_ERROR");
    expect(missingCountry.status).toBe(422);
    expect(missingCountry.body.error.code).toBe("INVALID_COUNTRY_ID");
  });
});

async function signup(
  baseUrl: string,
  user: { email: string; username: string; password: string },
): Promise<ApiResponse<AuthSuccessResponse>> {
  return {
    status: 200,
    body: await signupAndVerify(baseUrl, user),
  };
}

async function getFirstCountryId(baseUrl: string): Promise<string> {
  const countries = await requestRoute<CountryListResponse>(
    baseUrl,
    countriesManifest.listCountries,
    { query: { page: 1, limit: 20 } },
  );

  const firstCountry = countries.body.data[0];

  if (!firstCountry) {
    throw new Error("No seeded country found");
  }

  return firstCountry.id;
}

async function createAddress(
  baseUrl: string,
  accessToken: string,
  countryId: string,
  input: {
    label?: string;
    city: string;
    postalCode: string;
    line1: string;
    line2?: string;
  },
): Promise<ApiResponse<AddressResponse>> {
  return requestRoute<AddressResponse>(
    baseUrl,
    usersManifest.createMyAddress,
    {
      accessToken,
      body: {
        countryId,
        ...input,
      },
    },
  );
}

type ApiResponse<T> = {
  status: number;
  body: T;
};
