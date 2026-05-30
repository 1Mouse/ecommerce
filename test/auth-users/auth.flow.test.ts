import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { authManifest } from "../../src/modules/auth/auth.manifest.ts";
import { requestRoute, uniqueUser } from "../helpers/http.ts";
import {
  connectTestDatabase,
  createTestMongoUri,
  disconnectTestDatabase,
  resetTestDatabase,
} from "../helpers/test-db.ts";
import { startTestServer } from "../helpers/test-server.ts";
import type { TestServer } from "../helpers/test-server.ts";

type AuthSuccessResponse = {
  data: {
    user: {
      id: string;
      email: string;
      username: string;
    };
    accessToken: string;
    refreshToken: string;
  };
};

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

describe("auth API", () => {
  let server: TestServer;

  beforeAll(async () => {
    await connectTestDatabase(createTestMongoUri("auth-flow"));
    server = await startTestServer();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await server.close();
    await disconnectTestDatabase();
  });

  it("signs up a user and returns tokens without exposing password data", async () => {
    const user = uniqueUser("signup");

    const response = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.signup,
      { body: user },
    );

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      email: user.email,
      username: user.username,
    });
    expect(response.body.data.user.id).toEqual(expect.any(String));
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
  });

  it("lets a signed-up user login with valid credentials", async () => {
    const user = uniqueUser("login");
    await signup(server.baseUrl, user);

    const response = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.login,
      {
        body: {
          email: user.email,
          password: user.password,
        },
      },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      email: user.email,
      username: user.username,
    });
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("rejects login with an invalid password", async () => {
    const user = uniqueUser("bad_login");
    await signup(server.baseUrl, user);

    const response = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.login,
      {
        body: {
          email: user.email,
          password: "wrong-password",
        },
      },
    );

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects duplicate email and duplicate username during signup", async () => {
    const user = uniqueUser("duplicate");
    await signup(server.baseUrl, user);

    const duplicateEmail = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.signup,
      {
        body: {
          email: user.email,
          username: `${user.username}_x`.slice(0, 30),
          password: user.password,
        },
      },
    );

    const duplicateUsername = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.signup,
      {
        body: {
          email: `other-${user.email}`,
          username: user.username,
          password: user.password,
        },
      },
    );

    expect(duplicateEmail.status).toBe(409);
    expect(duplicateEmail.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
    expect(duplicateUsername.status).toBe(409);
    expect(duplicateUsername.body.error.code).toBe("USERNAME_ALREADY_EXISTS");
  });

  it("rotates refresh tokens and rejects reuse of the old refresh token", async () => {
    const user = uniqueUser("refresh");
    const signupResponse = await signup(server.baseUrl, user);
    const originalRefreshToken = signupResponse.body.data.refreshToken;

    const refreshResponse = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.refresh,
      { body: { refreshToken: originalRefreshToken } },
    );

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.refreshToken).not.toBe(originalRefreshToken);
    expect(refreshResponse.body.data.accessToken).toEqual(expect.any(String));

    const reusedTokenResponse = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.refresh,
      { body: { refreshToken: originalRefreshToken } },
    );

    expect(reusedTokenResponse.status).toBe(401);
    expect(reusedTokenResponse.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("logs out the current refresh token", async () => {
    const user = uniqueUser("logout");
    const signupResponse = await signup(server.baseUrl, user);
    const refreshToken = signupResponse.body.data.refreshToken;

    const logoutResponse = await requestRoute<{ data: { revoked: boolean } }>(
      server.baseUrl,
      authManifest.logout,
      { body: { refreshToken } },
    );

    const refreshResponse = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.refresh,
      { body: { refreshToken } },
    );

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.data.revoked).toBe(true);
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("logs out all refresh tokens for the authenticated user", async () => {
    const user = uniqueUser("logout_all");
    const signupResponse = await signup(server.baseUrl, user);
    const loginResponse = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.login,
      {
        body: {
          email: user.email,
          password: user.password,
        },
      },
    );

    const logoutAllResponse = await requestRoute<{ data: { revokedCount: number } }>(
      server.baseUrl,
      authManifest.logoutAll,
      {
        accessToken: signupResponse.body.data.accessToken,
      },
    );

    const firstRefreshResponse = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.refresh,
      { body: { refreshToken: signupResponse.body.data.refreshToken } },
    );
    const secondRefreshResponse = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.refresh,
      { body: { refreshToken: loginResponse.body.data.refreshToken } },
    );

    expect(logoutAllResponse.status).toBe(200);
    expect(logoutAllResponse.body.data.revokedCount).toBe(2);
    expect(firstRefreshResponse.status).toBe(401);
    expect(firstRefreshResponse.body.error.code).toBe("INVALID_REFRESH_TOKEN");
    expect(secondRefreshResponse.status).toBe(401);
    expect(secondRefreshResponse.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });
});

async function signup(
  baseUrl: string,
  user: { email: string; username: string; password: string },
): Promise<ApiResponse<AuthSuccessResponse>> {
  return requestRoute<AuthSuccessResponse>(baseUrl, authManifest.signup, {
    body: user,
  });
}

type ApiResponse<T> = {
  status: number;
  body: T;
};
