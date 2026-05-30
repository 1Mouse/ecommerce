import { env } from "../../config/env.ts";
import type { EmailService } from "../../infrastructure/email/email.service.ts";
import { UnauthorizedError } from "../../shared/errors/app-error.ts";
import type { User } from "../users/user.repository.ts";
import type { TokenService } from "./token.service.ts";
import type {
  EmailVerificationToken,
  EmailVerificationTokenRepository,
} from "./email-verification-token.repository.ts";

export class EmailVerificationService {
  private readonly tokens: EmailVerificationTokenRepository;
  private readonly tokenService: TokenService;
  private readonly emailService: EmailService;

  constructor(input: {
    tokens: EmailVerificationTokenRepository;
    tokenService: TokenService;
    emailService: EmailService;
  }) {
    this.tokens = input.tokens;
    this.tokenService = input.tokenService;
    this.emailService = input.emailService;
  }

  async sendVerificationEmail(user: User): Promise<void> {
    const token = this.tokenService.createOpaqueToken();
    const tokenHash = this.tokenService.hashToken(token);
    const verificationUrl = new URL(env.emailVerificationUrl);

    verificationUrl.searchParams.set("token", token);

    await this.tokens.createVerificationToken({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + env.emailVerificationExpiresInSeconds * 1_000),
    });

    await this.emailService.sendEmail({
      to: user.email,
      subject: "Verify your email",
      text: `Verify your email by opening this link: ${verificationUrl.toString()}`,
      html: `<p>Verify your email by opening this link:</p><p><a href="${verificationUrl.toString()}">${verificationUrl.toString()}</a></p>`,
    });
  }

  async verifyToken(token: string): Promise<EmailVerificationToken> {
    const tokenHash = this.tokenService.hashToken(token);
    const storedToken = await this.tokens.findByTokenHash(tokenHash);

    if (!this.isTokenActive(storedToken)) {
      throw new UnauthorizedError(
        "Invalid email verification token",
        "INVALID_EMAIL_VERIFICATION_TOKEN",
      );
    }

    return storedToken;
  }

  async markTokenUsed(tokenId: string): Promise<void> {
    await this.tokens.markUsed(tokenId);
  }

  private isTokenActive(
    token: EmailVerificationToken | null,
  ): token is EmailVerificationToken {
    return (
      token !== null &&
      token.usedAt === null &&
      token.deletedAt === null &&
      token.expiresAt.getTime() > Date.now()
    );
  }
}
