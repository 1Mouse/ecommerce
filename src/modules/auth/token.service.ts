import { createHash, randomUUID } from "node:crypto";

import { SignJWT, jwtVerify } from "jose";

import { env } from "../../config/env.ts";
import { UnauthorizedError } from "../../shared/errors/app-error.ts";
import type { PublicUser } from "../users/user.types.ts";

export type IssuedToken = {
  token: string;
  expiresAt: Date;
};

export type IssuedRefreshToken = IssuedToken & {
  jti: string;
};

export type VerifiedRefreshToken = {
  userId: string;
  jti: string;
};

export interface TokenService {
  createAccessToken(user: PublicUser): Promise<IssuedToken>;
  createRefreshToken(userId: string): Promise<IssuedRefreshToken>;
  verifyRefreshToken(token: string): Promise<VerifiedRefreshToken>;
  hashToken(token: string): string;
}

export class JoseTokenService implements TokenService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor() {
    const encoder = new TextEncoder();
    this.accessSecret = encoder.encode(env.jwtAccessTokenSecret);
    this.refreshSecret = encoder.encode(env.jwtRefreshTokenSecret);
  }

  async createAccessToken(user: PublicUser): Promise<IssuedToken> {
    const expiresAt = secondsFromNow(env.jwtAccessTokenExpiresInSeconds);
    const token = await new SignJWT({
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(this.accessSecret);

    return { token, expiresAt };
  }

  async createRefreshToken(userId: string): Promise<IssuedRefreshToken> {
    const jti = randomUUID();
    const expiresAt = secondsFromNow(env.jwtRefreshTokenExpiresInSeconds);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(userId)
      .setJti(jti)
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(this.refreshSecret);

    return { token, jti, expiresAt };
  }

  async verifyRefreshToken(token: string): Promise<VerifiedRefreshToken> {
    try {
      const verifiedToken = await jwtVerify(token, this.refreshSecret);
      const userId = verifiedToken.payload.sub;
      const jti = verifiedToken.payload.jti;

      if (typeof userId !== "string" || typeof jti !== "string") {
        throw new UnauthorizedError("Invalid refresh token");
      }

      return { userId, jti };
    } catch {
      throw new UnauthorizedError("Invalid refresh token");
    }
  }

  hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}

function secondsFromNow(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
