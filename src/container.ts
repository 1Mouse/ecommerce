import { AuthController } from "./modules/auth/auth.controller.ts";
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
const passwordService = new PasswordService();
const tokenService = new TokenService();

const countriesService = new CountriesService(countryRepository);
const usersService = new UsersService(userRepository);
const userAddressesService = new UserAddressesService(
  userAddressRepository,
  countriesService,
);

const authService = new AuthService({
  users: userRepository,
  refreshTokens: refreshTokenRepository,
  passwordService,
  tokenService,
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
