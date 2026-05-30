# Initial Email Verification Decisions

This document records the first email-verification design for the auth/users slice. The implementation will be done with TDD after these diagrams are accepted.

## Goal

Add email verification to signup using a local SMTP service in Podman.

For local development, use Mailpit:

```txt
docker.io/axllent/mailpit:v1.30
```

Mailpit provides:

- SMTP server on port `1025`
- Web inbox UI on port `8025`
- No real emails are sent
- Good developer feedback loop for email verification

## Signup Behavior Change

Previous behavior:

```txt
signup -> create user -> return accessToken + refreshToken
```

New behavior:

```txt
signup -> create unverified user -> create verification token -> send verification email -> return user + message
```

Signup no longer returns access or refresh tokens until the email is verified.

## Login Behavior Change

If a user has valid credentials but `emailVerifiedAt` is `null`, login is rejected.

Recommended response:

```txt
403 EMAIL_NOT_VERIFIED
```

This means credentials may be valid, but the account is not allowed to authenticate yet.

## Verification Behavior

Use a backend endpoint:

```txt
POST /api/v1/auth/verify-email
```

Body:

```json
{
  "token": "opaque-verification-token"
}
```

If token is valid:

- mark `users.emailVerifiedAt = now`
- mark `emailVerificationTokens.usedAt = now`
- return user + access token + refresh token

This keeps good UX: the user becomes authenticated immediately after successful verification.

## Resend Behavior

Add:

```txt
POST /api/v1/auth/resend-verification-email
```

Body:

```json
{
  "email": "user@example.com"
}
```

Behavior:

- If user exists and is unverified, create/send a new verification token.
- If user does not exist or is already verified, return a generic success message.

This avoids turning the resend endpoint into a user-enumeration endpoint.

## Verification Link

The email should contain a frontend verification URL:

```txt
EMAIL_VERIFICATION_URL=http://localhost:5173/verify-email
```

The backend appends the token:

```txt
http://localhost:5173/verify-email?token=<raw-token>
```

The frontend later reads the token from the URL and calls:

```txt
POST /api/v1/auth/verify-email
```

Until the frontend exists, Bruno can manually call the backend verify endpoint with the token copied from Mailpit.

## Data Model Changes

### `users`

Add:

```txt
emailVerifiedAt : date nullable
```

Meaning:

- `null` means not verified
- date means verified at that time

### `emailVerificationTokens`

New collection:

```txt
_id
userId
tokenHash
expiresAt
usedAt
createdAt
updatedAt
deletedAt
```

Indexes:

- `tokenHash` unique
- `userId` normal index
- `expiresAt` TTL index

Only token hashes are stored. Raw verification tokens are never stored.

## Token Rules

- Verification token is an opaque cryptographically random string.
- Database stores `SHA-256(token)`.
- Token lifetime: 24 hours.
- Token can be used once.
- Used, deleted, or expired tokens are invalid.

## SMTP Architecture

The auth module should not know Mailpit directly.

Use an email abstraction:

```txt
AuthService / EmailVerificationService
  -> EmailService interface
  -> SmtpEmailService adapter
  -> Mailpit SMTP in local Podman
```

Mailpit is local infrastructure, not domain logic.

## Environment Variables

Recommended local variables:

```txt
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="Ecommerce <no-reply@ecommerce.local>"
EMAIL_VERIFICATION_URL=http://localhost:5173/verify-email
EMAIL_VERIFICATION_EXPIRES_IN_SECONDS=86400
```

Inside the API container, SMTP host should be the Compose service name:

```txt
SMTP_HOST=mailpit
```

## Podman Compose Service

Recommended compose service:

```yaml
mailpit:
  image: docker.io/axllent/mailpit:v1.30
  ports:
    - "1025:1025"
    - "8025:8025"
```

Use Mailpit UI at:

```txt
http://localhost:8025
```

## Error Semantics

- Invalid token body shape: `400 VALIDATION_ERROR`
- Valid token shape but token missing/expired/used: `401 INVALID_EMAIL_VERIFICATION_TOKEN`
- Login before verification: `403 EMAIL_NOT_VERIFIED`
- Resend always returns generic success to avoid enumeration

## Route Manifest Additions

Add to `auth.manifest.ts`:

```txt
auth.verifyEmail
POST /api/v1/auth/verify-email
public

auth.resendVerificationEmail
POST /api/v1/auth/resend-verification-email
public
```

Run after route changes:

```bash
pnpm sync:bruno-routes
```

## TDD Order

Do not implement everything at once. Use vertical slices.

1. Signup returns success and sends a verification email to Mailpit.
2. Login before verification returns `403 EMAIL_NOT_VERIFIED`.
3. Verify email with valid token returns user + accessToken + refreshToken.
4. Verified user can login normally.
5. Reusing verification token returns `401 INVALID_EMAIL_VERIFICATION_TOKEN`.
6. Expired verification token returns `401 INVALID_EMAIL_VERIFICATION_TOKEN`.
7. Resend verification email returns generic success and sends a new email for unverified users.

## Out Of Scope For This Slice

- Production email provider
- HTML email templates beyond a minimal message
- Rate limiting resend attempts
- Email change workflow
- Admin manual verification
- Account cleanup for users who never verify
