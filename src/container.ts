import { SmtpEmailService } from "./infrastructure/email/smtp-email.service.ts";
import { S3ObjectStorageService } from "./infrastructure/storage/s3-object-storage.service.ts";
import { AuthController } from "./modules/auth/auth.controller.ts";
import { EmailVerificationService } from "./modules/auth/email-verification.service.ts";
import { EmailVerificationTokenRepository } from "./modules/auth/email-verification-token.repository.ts";
import { AuthMiddleware } from "./modules/auth/auth.middleware.ts";
import { AuthService } from "./modules/auth/auth.service.ts";
import { PasswordService } from "./modules/auth/password.service.ts";
import { RefreshTokenRepository } from "./modules/auth/refresh-token.repository.ts";
import { TokenService } from "./modules/auth/token.service.ts";
import { CountriesController } from "./modules/countries/countries.controller.ts";
import { CountriesService } from "./modules/countries/countries.service.ts";
import { CountryRepository } from "./modules/countries/country.repository.ts";
import { UserAddressRepository } from "./modules/users/user-address.repository.ts";
import { UserAddressesController } from "./modules/users/user-addresses.controller.ts";
import { UserAddressesService } from "./modules/users/user-addresses.service.ts";
import { UserRepository } from "./modules/users/user.repository.ts";
import { UsersController } from "./modules/users/users.controller.ts";
import { UsersService } from "./modules/users/users.service.ts";

const userRepository = new UserRepository();
const userAddressRepository = new UserAddressRepository();
const countryRepository = new CountryRepository();
const refreshTokenRepository = new RefreshTokenRepository();
const emailVerificationTokenRepository = new EmailVerificationTokenRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();
const emailService = new SmtpEmailService();
const objectStorageService = new S3ObjectStorageService();

const countriesService = new CountriesService(countryRepository);
const usersService = new UsersService(userRepository, objectStorageService);
const userAddressesService = new UserAddressesService(
  userAddressRepository,
  countriesService,
);
const emailVerificationService = new EmailVerificationService({
  tokens: emailVerificationTokenRepository,
  tokenService,
  emailService,
});

const authService = new AuthService({
  users: userRepository,
  refreshTokens: refreshTokenRepository,
  passwordService,
  tokenService,
  emailVerificationService,
});

const authController = new AuthController(authService);
const authMiddleware = new AuthMiddleware(tokenService);
const countriesController = new CountriesController(countriesService);
const usersController = new UsersController(usersService);
const userAddressesController = new UserAddressesController(userAddressesService);

export const container = {
  authController,
  authMiddleware,
  countriesController,
  usersController,
  userAddressesController,
} as const;
