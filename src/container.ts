import { AuthController } from "./modules/auth/auth.controller.ts";
import { AuthService } from "./modules/auth/auth.service.ts";
import { BcryptPasswordService } from "./modules/auth/password.service.ts";
import { JoseTokenService } from "./modules/auth/token.service.ts";
import { MongoRefreshTokenRepository } from "./modules/refresh-tokens/refresh-token.repository.ts";
import { MongoUserRepository } from "./modules/users/user.repository.ts";

const userRepository = new MongoUserRepository();
const refreshTokenRepository = new MongoRefreshTokenRepository();
const passwordHasher = new BcryptPasswordService();
const tokenService = new JoseTokenService();

const authService = new AuthService({
  users: userRepository,
  refreshTokens: refreshTokenRepository,
  passwordHasher,
  tokenService,
});

const authController = new AuthController(authService);

export const container = {
  authController,
} as const;
