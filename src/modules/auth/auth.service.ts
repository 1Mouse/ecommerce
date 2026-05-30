import { ConflictError, UnauthorizedError } from "../../shared/errors/app-error.ts";
import type { PublicUser, UserRepository } from "../users/user.repository.ts";
import { toPublicUser } from "../users/user.repository.ts";
import type { PasswordService } from "./password.service.ts";
import type { RefreshToken, RefreshTokenRepository } from "./refresh-token.repository.ts";
import type { TokenService } from "./token.service.ts";

export type AuthServiceDependencies = {
  users: UserRepository;
  refreshTokens: RefreshTokenRepository;
  passwordService: PasswordService;
  tokenService: TokenService;
};

export type AuthTokenResponse = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

export class AuthService {
  private readonly users: UserRepository;
  private readonly refreshTokens: RefreshTokenRepository;
  private readonly passwordService: PasswordService;
  private readonly tokenService: TokenService;

  constructor(dependencies: AuthServiceDependencies) {
    this.users = dependencies.users;
    this.refreshTokens = dependencies.refreshTokens;
    this.passwordService = dependencies.passwordService;
    this.tokenService = dependencies.tokenService;
  }

  async signup(input: {
    email: string;
    username: string;
    password: string;
  }): Promise<AuthTokenResponse> {
    const existingEmail = await this.users.findByEmail(input.email, {
      includeDeleted: true,
    });

    if (existingEmail) {
      throw new ConflictError("Email already exists", "EMAIL_ALREADY_EXISTS");
    }

    const existingUsername = await this.users.findByUsername(input.username, {
      includeDeleted: true,
    });

    if (existingUsername) {
      throw new ConflictError(
        "Username already exists",
        "USERNAME_ALREADY_EXISTS",
      );
    }

    const passwordHash = await this.passwordService.hashPassword(input.password);
    const user = await this.users.create({
      email: input.email,
      username: input.username,
      passwordHash,
      imageExt: null,
      phone: null,
      dob: null,
      deletedAt: null,
    });

    const tokens = await this.createTokenPair(user.id);

    return {
      user: toPublicUser(user),
      ...tokens,
    };
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthTokenResponse> {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const passwordMatches = await this.passwordService.verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const tokens = await this.createTokenPair(user.id);

    return {
      user: toPublicUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!this.isRefreshTokenActive(storedToken)) {
      throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }

    const user = await this.users.findById(storedToken.userId);

    if (!user) {
      throw new UnauthorizedError("Invalid refresh token", "INVALID_REFRESH_TOKEN");
    }

    const tokens = await this.createTokenPair(user.id);
    const newTokenHash = this.tokenService.hashRefreshToken(tokens.refreshToken);
    const newStoredToken = await this.refreshTokens.findByTokenHash(newTokenHash);

    if (!newStoredToken) {
      throw new Error("Created refresh token was not found");
    }

    await this.refreshTokens.revokeByTokenHash(tokenHash, newStoredToken.id);

    return {
      user: toPublicUser(user),
      ...tokens,
    };
  }

  async logout(refreshToken: string): Promise<{ revoked: boolean }> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const revokedToken = await this.refreshTokens.revokeByTokenHash(tokenHash);

    return {
      revoked: revokedToken !== null,
    };
  }

  async logoutAll(userId: string): Promise<{ revokedCount: number }> {
    return {
      revokedCount: await this.refreshTokens.revokeAllForUser(userId),
    };
  }

  private async createTokenPair(userId: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = await this.tokenService.createAccessToken(userId);
    const refreshToken = this.tokenService.createRefreshToken();
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);

    await this.refreshTokens.createRefreshToken({
      userId,
      tokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private isRefreshTokenActive(
    refreshToken: RefreshToken | null,
  ): refreshToken is RefreshToken {
    return (
      refreshToken !== null &&
      refreshToken.revokedAt === null &&
      refreshToken.deletedAt === null &&
      refreshToken.expiresAt.getTime() > Date.now()
    );
  }
}
