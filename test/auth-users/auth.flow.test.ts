import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { authManifest } from "../../src/modules/auth/auth.manifest.ts";
import { requestRoute, uniqueUser } from "../helpers/http.ts";
import { signupAndVerify } from "../helpers/auth.ts";
import type { AuthSuccessResponse, SignupVerificationResponse } from "../helpers/auth.ts";
import { clearMailpitMessages, extractVerificationToken, getLatestEmailFor } from "../helpers/mailpit.ts";
import {
  connectTestDatabase,
  createTestMongoUri,
  disconnectTestDatabase,
  resetTestDatabase,
} from "../helpers/test-db.ts";
import { startTestServer } from "../helpers/test-server.ts";
import type { TestServer } from "../helpers/test-server.ts";

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
    await clearMailpitMessages();
  });

  afterAll(async () => {
    await server.close();
    await disconnectTestDatabase();
  });

  it("signs up an unverified user and sends a verification email without returning auth tokens", async () => {
    const user = uniqueUser("signup");

    const response = await requestRoute<SignupVerificationResponse>(
      server.baseUrl,
      authManifest.signup,
      { body: user },
    );
    const message = await getLatestEmailFor(user.email);

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      email: user.email,
      username: user.username,
      emailVerifiedAt: null,
    });
    expect(response.body.data.user.id).toEqual(expect.any(String));
    expect(response.body.data.message).toBe("Verification email sent");
    expect(response.body.data).not.toHaveProperty("accessToken");
    expect(response.body.data).not.toHaveProperty("refreshToken");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(message.Subject).toBe("Verify your email");
    expect(extractVerificationToken(message)).toEqual(expect.any(String));
  });

  it("rejects login before email verification", async () => {
    const user = uniqueUser("unverified_login");
    await signup(server.baseUrl, user);

    const response = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.login,
      {
        body: {
          email: user.email,
          password: user.password,
        },
      },
    );

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("verifies email with a valid token and returns auth tokens", async () => {
    const user = uniqueUser("verify_email");
    await signup(server.baseUrl, user);
    const message = await getLatestEmailFor(user.email);
    const token = extractVerificationToken(message);

    const response = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.verifyEmail,
      { body: { token } },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({
      email: user.email,
      username: user.username,
    });
    expect(response.body.data.user.emailVerifiedAt).toEqual(expect.any(String));
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.refreshToken).toEqual(expect.any(String));
  });

  it("rejects reuse of an email verification token", async () => {
    const user = uniqueUser("verify_reuse");
    await signup(server.baseUrl, user);
    const message = await getLatestEmailFor(user.email);
    const token = extractVerificationToken(message);

    const firstResponse = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.verifyEmail,
      { body: { token } },
    );
    const reusedTokenResponse = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.verifyEmail,
      { body: { token } },
    );

    expect(firstResponse.status).toBe(200);
    expect(reusedTokenResponse.status).toBe(401);
    expect(reusedTokenResponse.body.error.code).toBe(
      "INVALID_EMAIL_VERIFICATION_TOKEN",
    );
  });

  it("rejects expired email verification tokens", async () => {
    const user = uniqueUser("verify_expired");
    await signup(server.baseUrl, user);
    const message = await getLatestEmailFor(user.email);
    const token = extractVerificationToken(message);
    const afterExpiry = new Date(Date.now() + 25 * 60 * 60 * 1_000);

    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(afterExpiry);

    try {
      const response = await requestRoute<ErrorResponse>(
        server.baseUrl,
        authManifest.verifyEmail,
        { body: { token } },
      );

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe("INVALID_EMAIL_VERIFICATION_TOKEN");
    } finally {
      vi.useRealTimers();
    }
  });

  it("resends a verification email with a generic response for unverified users", async () => {
    const user = uniqueUser("resend");
    await signup(server.baseUrl, user);
    await clearMailpitMessages();

    const response = await requestRoute<{ data: { message: string } }>(
      server.baseUrl,
      authManifest.resendVerificationEmail,
      { body: { email: user.email } },
    );
    const missingUserResponse = await requestRoute<{ data: { message: string } }>(
      server.baseUrl,
      authManifest.resendVerificationEmail,
      { body: { email: `missing-${user.email}` } },
    );
    const message = await getLatestEmailFor(user.email);
    const token = extractVerificationToken(message);
    const verifyResponse = await requestRoute<AuthSuccessResponse>(
      server.baseUrl,
      authManifest.verifyEmail,
      { body: { token } },
    );

    expect(response.status).toBe(200);
    expect(response.body.data.message).toBe(
      "If an unverified account exists, a verification email has been sent",
    );
    expect(missingUserResponse.status).toBe(200);
    expect(missingUserResponse.body).toEqual(response.body);
    expect(message.Subject).toBe("Verify your email");
    expect(verifyResponse.status).toBe(200);
  });

  it("lets a signed-up user login with valid credentials", async () => {
    const user = uniqueUser("login");
    await signupAndVerify(server.baseUrl, user);

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
    await signupAndVerify(server.baseUrl, user);

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
    const signupResponse = await signupAndVerify(server.baseUrl, user);
    const originalRefreshToken = signupResponse.data.refreshToken;

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
    const signupResponse = await signupAndVerify(server.baseUrl, user);
    const refreshToken = signupResponse.data.refreshToken;

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
    const signupResponse = await signupAndVerify(server.baseUrl, user);
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
        accessToken: signupResponse.data.accessToken,
      },
    );

    const firstRefreshResponse = await requestRoute<ErrorResponse>(
      server.baseUrl,
      authManifest.refresh,
      { body: { refreshToken: signupResponse.data.refreshToken } },
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
): Promise<ApiResponse<SignupVerificationResponse>> {
  return requestRoute<SignupVerificationResponse>(baseUrl, authManifest.signup, {
    body: user,
  });
}

type ApiResponse<T> = {
  status: number;
  body: T;
};
