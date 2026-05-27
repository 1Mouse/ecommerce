import {
  ConflictError,
  UnauthorizedError,
} from "../../shared/errors/app-error.ts";
import type { RefreshTokenRepository } from "../refresh-tokens/refresh-token.types.ts";
import { toPublicUser } from "../users/user.mapper.ts";
import type { UserRecord, UserRepository } from "../users/user.types.ts";
import type { PasswordHasher } from "./password.service.ts";
import type { TokenService } from "./token.service.ts";
import type { AuthSession, LoginInput, RefreshInput, SignupInput } from "./auth.types.ts";

export type AuthServiceDependencies = {
  users: UserRepository;
  refreshTokens: RefreshTokenRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
};

export class AuthService {
  private readonly users: UserRepository;
  private readonly refreshTokens: RefreshTokenRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly tokenService: TokenService;

  constructor(dependencies: AuthServiceDependencies) {
    this.users = dependencies.users;
    this.refreshTokens = dependencies.refreshTokens;
    this.passwordHasher = dependencies.passwordHasher;
    this.tokenService = dependencies.tokenService;
  }

  async signup(input: SignupInput): Promise<AuthSession> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.users.findByEmail(email);

    if (existingUser !== null) {
      throw new ConflictError("Email is already registered");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash,
    });

    return this.issueSession(user);
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const email = normalizeEmail(input.email);
    const user = await this.users.findByEmailWithPasswordHash(email);

    if (user === null || user.passwordHash === undefined) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return this.issueSession(user);
  }

  async refresh(input: RefreshInput): Promise<AuthSession> {
    const verifiedRefreshToken = await this.tokenService.verifyRefreshToken(
      input.refreshToken,
    );
    const tokenHash = this.tokenService.hashToken(input.refreshToken);
    const storedRefreshToken = await this.refreshTokens.findActiveByTokenHash(
      tokenHash,
    );

    if (
      storedRefreshToken === null ||
      storedRefreshToken.userId !== verifiedRefreshToken.userId ||
      storedRefreshToken.jti !== verifiedRefreshToken.jti
    ) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const user = await this.users.findById(verifiedRefreshToken.userId);

    if (user === null) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    await this.refreshTokens.revokeById(storedRefreshToken.id);

    return this.issueSession(user);
  }

  private async issueSession(user: UserRecord): Promise<AuthSession> {
    const publicUser = toPublicUser(user);
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.createAccessToken(publicUser),
      this.tokenService.createRefreshToken(user.id),
    ]);

    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: this.tokenService.hashToken(refreshToken.token),
      jti: refreshToken.jti,
      expiresAt: refreshToken.expiresAt,
    });

    return {
      user: publicUser,
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
      refreshTokenExpiresAt: refreshToken.expiresAt.toISOString(),
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
