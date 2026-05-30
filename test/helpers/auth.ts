import { authManifest } from "../../src/modules/auth/auth.manifest.ts";
import { requestRoute, uniqueUser } from "./http.ts";
import { extractVerificationToken, getLatestEmailFor } from "./mailpit.ts";

export type TestUser = ReturnType<typeof uniqueUser>;

export type AuthSuccessResponse = {
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      emailVerifiedAt: string | null;
    };
    accessToken: string;
    refreshToken: string;
  };
};

export type SignupVerificationResponse = {
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      emailVerifiedAt: string | null;
    };
    message: string;
  };
};

export async function signupAndVerify(
  baseUrl: string,
  user: TestUser,
): Promise<AuthSuccessResponse> {
  await requestRoute<SignupVerificationResponse>(baseUrl, authManifest.signup, {
    body: user,
  });

  const message = await getLatestEmailFor(user.email);
  const token = extractVerificationToken(message);
  const verifyResponse = await requestRoute<AuthSuccessResponse>(
    baseUrl,
    authManifest.verifyEmail,
    {
      body: { token },
    },
  );

  return verifyResponse.body;
}
