import { createHash, randomBytes } from "node:crypto";

import { jwtVerify, SignJWT } from "jose";

import { env } from "../../config/env.ts";
import { UnauthorizedError } from "../../shared/errors/app-error.ts";

type AccessTokenPayload = {
  sub: string;
  type: "access";
};

export class TokenService {
  private readonly accessTokenSecret: Uint8Array;

  constructor() {
    this.accessTokenSecret = new TextEncoder().encode(env.jwtAccessTokenSecret);
  }

  async createAccessToken(userId: string): Promise<string> {
    return new SignJWT({ type: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${env.jwtAccessTokenExpiresInSeconds}s`)
      .sign(this.accessTokenSecret);
  }

  async verifyAccessToken(accessToken: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(accessToken, this.accessTokenSecret);
      const tokenPayload = payload as Partial<AccessTokenPayload>;

      if (tokenPayload.type !== "access" || typeof tokenPayload.sub !== "string") {
        throw new UnauthorizedError("Invalid access token", "INVALID_ACCESS_TOKEN");
      }

      return tokenPayload.sub;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError("Invalid access token", "INVALID_ACCESS_TOKEN");
    }
  }

  createRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  getRefreshTokenExpiresAt(): Date {
    return new Date(Date.now() + env.jwtRefreshTokenExpiresInSeconds * 1_000);
  }
}
