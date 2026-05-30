# Initial Auth, Users, Countries Decisions

This document records the architecture decisions for the first auth/users slice before implementation. The project is a modular monolith using Express, TypeScript, MongoDB, Mongoose, Zod, and JWT access tokens with opaque refresh tokens.

## Architecture Style

- The backend is a modular monolith.
- Modules live under `src/modules`.
- Each module owns its HTTP, validation, service, repository, and model files.
- The dependency flow is `routes -> controller -> service -> repository -> model`.
- Controllers do not call other controllers.
- Cross-module calls go through another module's service, not its repository.
- Concrete repositories stay inside their modules.
- The reusable Mongo base repository lives in infrastructure because it imports Mongo/Mongoose concepts.

## Module Boundaries

### `auth`

Owns authentication workflows and refresh token persistence.

- Signup
- Login
- Refresh token rotation
- Logout current device
- Logout all devices
- Access token verification middleware
- Refresh token model/repository
- Password hashing
- Token signing and verification

### `users`

Owns user account data and user-owned addresses.

- Current user read/update/delete
- User address CRUD
- User and user address models/repositories
- Address validation that depends on countries through `CountriesService`

### `countries`

Owns country reference data.

- Public country read endpoints
- Internal create/update/delete service methods for seeding and future admin use
- Country model/repository

## Mongo Collections

The initial collections are:

- `users`
- `userAddresses`
- `countries`
- `refreshTokens`

`blacklistedTokens` was rejected. `jwtVersion` was also rejected.

## ERD Source Of Truth

The PUML ERD lives at:

```txt
docs/ERDs/user.puml
```

MongoDB-native `_id` is used in the ERD. Repositories map `_id` to `id` before returning plain app objects to services/controllers/API responses.

## User Collection

Fields:

- `_id : ObjectId`
- `email : string <<unique>>`
- `username : string <<unique>>`
- `passwordHash : string`
- `imageExt : string`
- `phone : string`
- `dob : date`
- `createdAt : date`
- `updatedAt : date`
- `deletedAt : date`

Validation decisions:

- `email` is required, trimmed, lowercased, valid email format, max 254 chars, and globally unique.
- `username` is required, trimmed, lowercased, 3-30 chars, only letters/numbers/underscore, and globally unique.
- `password` is accepted only during signup, min 8 chars, max 72 chars.
- `passwordHash` is stored, never the raw password.
- `phone` is optional and must use E.164 format when provided.
- `dob` is optional, must be a valid date, and must be in the past.
- `imageExt` is optional avatar metadata and is not part of signup for now.

Soft-deleted users keep their unique email/username reserved for now.

## User Addresses Collection

Fields:

- `_id : ObjectId`
- `userId : ObjectId <<index>>`
- `countryId : ObjectId`
- `label : string`
- `city : string`
- `postalCode : string`
- `line1 : string`
- `line2 : string`
- `createdAt : date`
- `updatedAt : date`
- `deletedAt : date`

Validation decisions:

- `countryId` must be a valid ObjectId.
- If `countryId` format is invalid, return `400 VALIDATION_ERROR`.
- If `countryId` format is valid but no active country exists, return `422 INVALID_COUNTRY_ID`.
- `label` is optional, max 50 chars.
- `city` is required, max 100 chars.
- `postalCode` is required, max 20 chars.
- `line1` is required, max 200 chars.
- `line2` is optional, max 200 chars.
- `userId` is indexed because listing current user's addresses is a common query.
- `countryId` is not indexed for now to avoid unnecessary write/index overhead.

## Countries Collection

Fields:

- `_id : ObjectId`
- `iso2 : string <<unique>>`
- `iso3 : string <<unique>>`
- `name : string <<unique>>`
- `createdAt : date`
- `updatedAt : date`
- `deletedAt : date`

Validation decisions:

- `iso2` is required, uppercase, exactly 2 chars, and unique.
- `iso3` is required, uppercase, exactly 3 chars, and unique.
- `name` is required, trimmed, max 100 chars, and unique.
- Countries are reference data.
- Public API exposes country reads only for now.
- Country writes exist in service/repository for seed scripts and future admin routes.
- Seed script starts with only `EG / EGY / Egypt` and `US / USA / United States`.

## Refresh Tokens Collection

Fields:

- `_id : ObjectId`
- `userId : ObjectId <<index>>`
- `tokenHash : string <<unique>>`
- `expiresAt : date <<ttl>>`
- `revokedAt : date`
- `replacedByTokenId : ObjectId`
- `createdAt : date`
- `updatedAt : date`
- `deletedAt : date`

Decisions:

- Access tokens are JWTs.
- Refresh tokens are opaque cryptographically random strings, not JWTs.
- Only SHA-256 hashes of refresh tokens are stored.
- Refresh token lifetime is 30 days.
- Access token lifetime is 15 minutes.
- Refresh tokens rotate on every refresh.
- `tokenHash` is unique. A unique index also provides fast lookup.
- `userId` is indexed for logout-all.
- `expiresAt` uses a TTL index for automatic cleanup.
- TTL cleanup is not considered immediate, so services still check expiry explicitly.
- `refreshTokens` has no public CRUD endpoints.

## Access Token Model

Access tokens are stateless JWTs.

Payload:

```json
{
  "sub": "userId",
  "type": "access",
  "iat": 123,
  "exp": 123
}
```

Decisions:

- Protected route middleware verifies JWT signature, expiry, and token type.
- Middleware attaches `userId` to the request.
- Middleware does not query MongoDB on every protected request.
- Services load the user when fresh user data is needed.
- Logout revokes refresh tokens, not already issued access tokens.
- Existing access tokens may work until they expire, which is accepted because access tokens live for only 15 minutes.

## Routes

### Auth Routes

```txt
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
```

Decisions:

- Signup accepts only `email`, `username`, and `password`.
- Signup auto-logs in for now and returns user, access token, and refresh token.
- Login returns user, access token, and refresh token.
- Refresh accepts refresh token in JSON body and returns a new access token and a new refresh token.
- Logout accepts refresh token in JSON body and revokes the current refresh token session.
- Logout-all requires a valid access token and revokes all active refresh tokens for the user.
- Refresh tokens are transported through JSON bodies for now, not HTTP-only cookies.

### User Routes

```txt
GET    /api/v1/users/me
PATCH  /api/v1/users/me
DELETE /api/v1/users/me
```

Decisions:

- User creation happens only through `POST /api/v1/auth/signup` for now.
- `PATCH /api/v1/users/me` allows only `username`, `phone`, and `dob` for now.
- Email change, password change, and avatar upload are separate future workflows.
- Delete uses soft delete and returns `200` with the standard response envelope.

### User Address Routes

```txt
GET    /api/v1/users/me/addresses
POST   /api/v1/users/me/addresses
GET    /api/v1/users/me/addresses/:addressId
PATCH  /api/v1/users/me/addresses/:addressId
DELETE /api/v1/users/me/addresses/:addressId
```

Decisions:

- All address routes require authentication.
- Addresses are owned by the current authenticated user.
- Address delete is a soft delete and returns `200` with the standard response envelope.
- Address create/update verifies that the referenced country exists and is not soft-deleted.

### Country Routes

```txt
GET /api/v1/countries
GET /api/v1/countries/:countryId
```

Decisions:

- Public country API is read-only for now.
- Country writes are reserved for seed scripts and future admin routes.

## Pagination

List endpoints are paginated by default.

Query params:

```txt
page=1
limit=20
```

Defaults:

- `page = 1`
- `limit = 20`
- `max limit = 100`

Response shape:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## API Response Envelope

Success response:

```json
{
  "data": {}
}
```

List response:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": []
  }
}
```

## HTTP Error Semantics

- `400 Bad Request` means the request shape is invalid.
- `401 Unauthorized` means authentication is missing or invalid.
- `404 Not Found` means the requested URL resource does not exist.
- `409 Conflict` means a unique/business conflict exists.
- `422 Unprocessable Entity` means the request shape is valid, but the business meaning is invalid.

Examples:

- Invalid email format returns `400 VALIDATION_ERROR`.
- Missing requested country route resource returns `404 COUNTRY_NOT_FOUND`.
- Duplicate email returns `409 EMAIL_ALREADY_EXISTS`.
- Valid ObjectId countryId that does not point to an active country during address creation returns `422 INVALID_COUNTRY_ID`.

## Zod Behavior

- Zod schemas use strip mode for unknown body fields.
- Unknown fields are ignored instead of rejected.
- PATCH schemas are partial but only for explicitly allowed fields.

## Repository Pattern

The base repository lives at:

```txt
src/infrastructure/database/mongodb/mongo-base-crud.repository.ts
```

Concrete repositories live inside modules:

```txt
src/modules/users/user.repository.ts
src/modules/users/user-address.repository.ts
src/modules/countries/country.repository.ts
src/modules/auth/refresh-token.repository.ts
```

Decisions:

- Concrete repositories extend the base Mongo CRUD repository.
- Repositories return plain app objects, not Mongoose documents.
- Repositories map `_id` to `id` for app/API usage.
- Base repository handles soft-delete filtering automatically by excluding deleted records by default.
- Base repository supports pagination for list methods.
- Base repository provides soft-delete methods that set `deletedAt` instead of physically deleting documents.

## Mongoose Timestamps And Soft Deletes

- All models use Mongoose `timestamps: true`.
- Mongoose manages `createdAt` and `updatedAt`.
- The application manages `deletedAt`.
- Normal reads exclude soft-deleted records.
- Delete routes set `deletedAt` and return a `200` response envelope.

## Index Policy

Indexes are intentionally limited because indexes improve reads but cost disk, memory, and write performance.

Approved indexes:

- `users.email` unique
- `users.username` unique
- `userAddresses.userId` normal index
- `countries.iso2` unique
- `countries.iso3` unique
- `countries.name` unique
- `refreshTokens.tokenHash` unique
- `refreshTokens.userId` normal index
- `refreshTokens.expiresAt` TTL index

Not indexed for now:

- `userAddresses.countryId`

## File Naming Direction

Each public module should have routes, controller, service, schema, repository, and model files.

Expected shape:

```txt
src/modules/auth/
  auth.controller.ts
  auth.middleware.ts
  auth.routes.ts
  auth.schema.ts
  auth.service.ts
  refresh-token.model.ts
  refresh-token.repository.ts

src/modules/users/
  user.model.ts
  user.repository.ts
  users.controller.ts
  users.routes.ts
  users.schema.ts
  users.service.ts
  user-address.model.ts
  user-address.repository.ts
  user-addresses.controller.ts
  user-addresses.schema.ts
  user-addresses.service.ts

src/modules/countries/
  country.model.ts
  country.repository.ts
  countries.controller.ts
  countries.routes.ts
  countries.schema.ts
  countries.service.ts
```

## Out Of Scope For This Slice

- Admin roles and permissions
- Public user IDs in routes
- Email verification
- Password reset
- Password change
- Email change
- Avatar upload
- HTTP-only refresh-token cookies
- Access token blacklist
- `jwtVersion`
- Multi-tenancy
- Payments
- Orders
- Products
- WebSockets
- AI streaming
- Scheduler/cron jobs
