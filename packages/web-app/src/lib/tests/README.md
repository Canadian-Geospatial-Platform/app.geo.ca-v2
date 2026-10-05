# Web App Test Guide

This directory contains focused Vitest suites for the web-app package. Most of the current coverage is around the OIDC sign-in flow, logout handling, scope policy enforcement, and favourites API mutations.

## How to run tests

Run from the web-app package directory:

```bash
npm run test
```

Run a single suite:

```bash
npm run test -- src/lib/tests/id-token-verification.test.ts
```

Run a small group of related suites:

```bash
npm run test -- src/lib/tests/sign-in-core.test.ts src/lib/tests/sign-in-core-token-exchange.test.ts src/lib/tests/id-token-verification.test.ts
```

If you are starting from the repository root, change into the package first:

```bash
cd packages/web-app
npm run test
```

## Test runner configuration

- Test runner: Vitest
- Config file: `packages/web-app/vite.config.ts`
- Included test pattern: `src/**/*.test.ts`
- Runtime environment: Node

## Suite overview

### Auth flow

- `sign-in-send-route.test.ts`
  - Verifies the sign-in start route sets PKCE and nonce cookies and redirects to the provider, or falls back safely when auth is not configured.

- `sign-in-receive-route.test.ts`
  - Verifies the callback route's `failAuth` guard for every failure reason (missing code, state mismatch, token exchange/nonce failure, ID token verification failure, cookie-set failure) and the successful redirect/favourites-merge path.

- `sign-in-post-auth.test.ts`
  - Verifies post-auth redirect sanitization (`getPostAuthRedirect`), post-logout path resolution (`getPostLogoutRedirectPath`), and `completeLocalLogout` (cookie clearing + redirect resolution together, shared by both `/sign-in/logout` routes).

- `sign-in-core.test.ts`
  - Covers low-level auth helpers: PKCE challenge generation, nonce/state cookie set + consume, authorize/logout URL construction, `isOidcConfigured`, `setAuthCookies`, and the secure-cookie-flag-by-`NODE_ENV` rule.

- `sign-in-core-token-exchange.test.ts`
  - Covers `exchangeCodeForTokens` and `exchangeRefreshToken` token exchange policy for `private_key_jwt` versus `client_secret_post`, including fail-closed behavior outside localhost and every error-logging branch for both functions.

- `scope-policy.test.ts`
  - Covers `OIDC_REQUESTED_SCOPES` parsing, authorize scope generation, and scoped ID token claim validation.

- `oidc-claims.test.ts`
  - Covers the individual OIDC claim validators (`getAudienceValues`, `issuerMatches`, `hasValidExp`, `hasNumericIat`, `hasValidNbf`) directly, including clock-skew boundary cases.

- `id-token-verification.test.ts`
  - Verifies ID token signature/claims handling including expiration, nonce validation, issuer discovery fallback, and scoped claim validation.

- `client-assertion.test.ts`
  - Covers RS256 client assertion JWT creation for `private_key_jwt`, including claim contents, expiration, determinism, and invalid key handling.

- `secrets-manager-policy.test.ts`
  - Verifies IAM policy generation for AWS Secrets Manager access to the private key used in `private_key_jwt` authentication.

- `oidc-private-key-material.test.ts`
  - Covers `getPrivateKeyMaterial()` JSON/PEM normalization, escaped-newline handling, and certificate thumbprint computation.

- `parse-jwt.test.ts`
  - Covers `getToken()` cookie-based ID token loading, including clearing cookies on stale refresh tokens or failed verification.

- `session-cookie.test.ts`
  - Covers the HMAC-signed session cookie: creation, touch/refresh, tampered-signature rejection, user/session mismatch, and inactivity/maximum-session timeouts.

- `session-route.test.ts`
  - Covers the `/api/session` GET status endpoint and POST refresh endpoint, including unauthenticated, invalid-refresh, session-touch, cookie-persistence, and successful-refresh paths.

- `cookie-policy.test.ts`
  - Covers the environment-based Secure cookie policy for development and production.

- `auth-cookies.test.ts`
  - Verifies central cleanup deletes the session and all temporary authentication-flow cookies.

- `guest-favourites.test.ts`
  - Covers `encodeGuestFavouritesCookieValue`/`decodeGuestFavouritesCookieValue`: encode/decode round-trip, whitespace/dedup normalization, and malformed-URI fallback.

- `language.test.ts`
  - Covers `getAppLanguage`, `isAppLanguage`, `isFrench`, `pickByLanguage`, and `getLangFromPath` (path and absolute-URL forms).

### Logout handling

- `back-channel-logout.test.ts`
  - Verifies back-channel logout token validation, including audience, required logout event, `jti`, and supported signing algorithm checks.

- `back-channel-logout-route.test.ts`
  - Verifies the back-channel logout route returns the right status codes for missing tokens, invalid tokens, replayed logout notifications, persistence failures, and successful revocation.

- `front-channel-logout-route.test.ts`
  - Verifies the front-channel logout endpoint always returns 204 and clears cookies, even with `returnTo`-style query params (no open-redirect behavior).

- `sign-in-logout-route.test.ts`
  - Verifies the localized and non-localized logout routes, and the OIDC logout redirect route, clear auth cookies and redirect appropriately for signed-in and guest users.

- `user-revocation.test.ts`
  - Covers the `markUserAuthRevoked()` database operation that records back-channel logout revocation markers (`authRevokedAt`).

### Favourites

- `favourites-api.test.ts`
  - Covers all four favourites API operations: POST/DELETE (single dataset id add/remove), PUT (clear all), and PATCH (map-config create/delete, including duplicate-name auto-renaming and the max-item limit).

- `favourites-route-split.test.ts`
  - Verifies the split favourites routes (`/favourites`, `/favourites/datasets`, `/favourites/maps`, `/favourites/view`) correctly load page data and remain accessible to guests and signed-in users.

- `favourites-merge.test.ts`
  - Covers `mergeGuestFavourites()` (in `$lib/db/favourites.ts`): happy-path merge/dedupe, persistence-failure rollback, empty guest list, missing user uuid, and cookie decode failure.

- `user-data-loading.test.ts`
  - Covers the `getUserData()` function for loading user DynamoDB records by UUID, including various load status states (anonymous, ok, missing, unavailable).

## Shared test helpers

- `auth-test-helpers.ts`
  - Provides reusable helpers for auth tests, including temporary RSA key generation, OIDC discovery/JWKS stubbing, and signed JWT creation.

## Practical tips

- Most auth route tests use `vi.mock(...)` to isolate route behavior from lower-level helpers.
- Many auth tests rely on `vi.stubEnv(...)` for OIDC configuration and scope policy setup.
- If a change affects OIDC flow behavior, the fastest validation set is usually:

```bash
npm run test -- src/lib/tests/sign-in-core.test.ts src/lib/tests/sign-in-core-token-exchange.test.ts src/lib/tests/id-token-verification.test.ts src/lib/tests/sign-in-receive-route.test.ts
```

- If a change affects logout handling, run:

```bash
npm run test -- src/lib/tests/back-channel-logout.test.ts src/lib/tests/back-channel-logout-route.test.ts src/lib/tests/sign-in-logout-route.test.ts
```

- If a change affects favourites routes or API, run:

```bash
npm run test -- src/lib/tests/favourites-api.test.ts src/lib/tests/favourites-route-split.test.ts src/lib/tests/user-data-loading.test.ts
```
