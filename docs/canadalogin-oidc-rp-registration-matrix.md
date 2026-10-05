# CanadaLogin OIDC RP Registration Matrix

Use this worksheet to prepare one submission per environment (Test, Staging, Production) using the CanadaLogin relying party registration form (OIDC).

For optional advanced JOSE features (Request Object, JARM, JWE), see `docs/canadalogin-advanced-capabilities-assessment.md`.
For copy/paste submission content, see `docs/canadalogin-oidc-rp-submission-answers.md`.

## How to use

1. Create and validate the environment base URL.
2. Review prefilled values and confirm they match the environment being submitted.
3. Copy the values into the form exactly as listed.
4. Repeat for each environment.

## Environment-specific values

Derived from current repository evidence:

- Test host mapping provided: https://app-dev.geo.ca.
- Public production host: https://app.geo.ca.
- Staging host mapping provided: https://app-stage.geo.ca.
- Suggested bilingual application names are taken from UI metadata text:
  - English: Geospatial Data Catalog
  - French: Catalogue de données géospatiales
- Deployment stages in this repo are `development`, `staging`, and `production`.

| Form field                             | Test                                                                                                             | Staging                                              | Production                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| CanadaLogin environment                | Test                                                                                                             | Staging                                              | Production                                     |
| App name (English)                     | Geospatial Data Catalog                                                                                          | Geospatial Data Catalog                              | Geospatial Data Catalog                        |
| App name (French)                      | Catalogue de données géospatiales                                                                                | Catalogue de données géospatiales                    | Catalogue de données géospatiales              |
| Application environment URL (English)  | https://app-dev.geo.ca/en-ca                                                                                     | https://app-stage.geo.ca/en-ca                       | https://app.geo.ca/en-ca                       |
| Application environment URL (French)   | https://app-dev.geo.ca/fr-ca                                                                                     | https://app-stage.geo.ca/fr-ca                       | https://app.geo.ca/fr-ca                       |
| Redirect URL(s)                        | http://localhost:8080/sign-in/receive, https://app-dev.geo.ca/sign-in/receive (optional)                         | https://app-stage.geo.ca/sign-in/receive             | https://app.geo.ca/sign-in/receive             |
| Post Logout Redirect URL(s)            | http://localhost:8080/sign-in/logout, https://app-dev.geo.ca/sign-in/logout (optional)                           | https://app-stage.geo.ca/sign-in/logout              | https://app.geo.ca/sign-in/logout              |
| Logout request method                  | Back-channel logout (preferred)                                                                                  | Back-channel logout (preferred)                      | Back-channel logout (preferred)                |
| Logout request URL                     | http://localhost:8080/sign-in/back-channel-logout, https://app-dev.geo.ca/sign-in/back-channel-logout (optional) | https://app-stage.geo.ca/sign-in/back-channel-logout | https://app.geo.ca/sign-in/back-channel-logout |
| Client type                            | Confidential Client                                                                                              | Confidential Client                                  | Confidential Client                            |
| Auth flow                              | Authorization Code (response_type=code)                                                                          | Authorization Code (response_type=code)              | Authorization Code (response_type=code)        |
| Authentication method                  | private_key_jwt preferred; localhost-only fallback to client_secret_post for local development                   | private_key_jwt (strict; no non-local fallback)      | private_key_jwt (strict; no non-local fallback) |
| JWKS sharing method                    | Offline exchange (public key/certificate)                                                                        | Offline exchange (public key/certificate)            | Offline exchange (public key/certificate)      |
| Requested scopes                       | openid (required). Add profile/email/phone/language only if justified by product requirements.                   | openid (required). Add extras only if needed.        | openid (required). Add extras only if needed.  |
| Sector identifier                      | https://app-dev.geo.ca                                                                                           | https://app-stage.geo.ca                             | https://app.geo.ca                             |
| Share pairwise identifiers across apps | No                                                                                                               | No                                                   | No                                             |
| Migration: Sector Identifier URL       | Not applicable                                                                                                   | Not applicable                                       | Not applicable                                 |

### Concrete URL values to submit

Use these exact values in the registration form:

| Environment | Base URL                 | Redirect URL                                                                              | Post Logout Redirect URL                                                               | Logout request URL                                                                                               |
| ----------- | ------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Test        | https://app-dev.geo.ca   | http://localhost:8080/sign-in/receive , https://app-dev.geo.ca/sign-in/receive (optional) | http://localhost:8080/sign-in/logout, https://app-dev.geo.ca/sign-in/logout (optional) | http://localhost:8080/sign-in/back-channel-logout, https://app-dev.geo.ca/sign-in/back-channel-logout (optional) |
| Staging     | https://app-stage.geo.ca | https://app-stage.geo.ca/sign-in/receive                                                  | https://app-stage.geo.ca/sign-in/logout                                                | https://app-stage.geo.ca/sign-in/back-channel-logout                                                             |
| Production  | https://app.geo.ca       | https://app.geo.ca/sign-in/receive                                                        | https://app.geo.ca/sign-in/logout                                                      | https://app.geo.ca/sign-in/back-channel-logout                                                                   |

### Test registration note

Test currently has a public base URL (`https://app-dev.geo.ca`) but registration generally uses localhost callback/logout endpoints (`http://localhost:8080/...`). Keep both sets aligned with current integration practice and CanadaLogin environment expectations.

### JWKS sharing note

Current implementation uses private_key_jwt with RS256 and is documented for public key/certificate exchange with the provider. A dedicated client `jwks_uri` endpoint is not currently implemented in this application.

### Deployment contract note

- For staging and production, `OIDC_PRIVATE_KEY_SECRET_ID` must be configured and valid.
- Accepted formats: Secrets Manager secret name/id (for example `staging/oidc/private-key`) or full secret ARN.
- Deployments fail fast in strict private_key_jwt stages when this value is missing or malformed.

## Current implementation posture (as of 2026-05-29)

| Form section                                        | Current support                                 | Notes                                                                                                |
| --------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PKCE                                                | Yes, S256                                       | Implemented and used in sign-in flow.                                                                |
| Requested scopes policy                             | Yes                                             | Configurable via `OIDC_REQUESTED_SCOPES`; defaults to `openid`.                                      |
| Back-channel logout                                 | Yes                                             | Implemented and now includes replay handling via logout token jti deduplication.                     |
| private_key_jwt                                     | Yes (strict in staging/production)              | Staging and production enforce private_key_jwt; if key material is unavailable, token exchange fails closed. |
| client_secret_basic                                 | No                                              | Not implemented.                                                                                     |
| client_secret_post                                  | Local development fallback only                 | Allowed only on localhost development paths; not used for staging or production sign-in.            |
| RP message signing: Request Object                  | No                                              | Not currently implemented.                                                                           |
| RP message signing: Token Endpoint client_assertion | Yes                                             | Implemented for private_key_jwt flow.                                                                |
| CanadaLogin signature validation: ID Token          | Yes (RS256)                                     | Implemented.                                                                                         |
| Scope-tied claim validation                         | Yes (type validation for present scoped claims) | Enforces claim type correctness when scoped claims are included in ID token.                         |
| CanadaLogin signature validation: UserInfo endpoint | No                                              | UserInfo endpoint path not currently implemented.                                                    |
| Encryption of RP messages                           | No                                              | Not currently implemented.                                                                           |
| Decryption of CanadaLogin messages (JWE/JARM)       | No                                              | Not currently implemented.                                                                           |

## UserInfo support decision (current)

- Decision: Do not implement UserInfo endpoint consumption at this time.
- Current source of user identity: Verified ID token claims only.
- Rationale:
  - Current application behavior does not require additional profile retrieval beyond ID token claims.
  - Minimizes external dependency calls and reduces operational complexity.
  - Keeps privacy footprint smaller by not fetching additional user attributes unless needed.
- Revisit triggers:
  - CanadaLogin compliance testing explicitly requires UserInfo support.
  - Product requirements start depending on claims available only through UserInfo.
  - Security/compliance review requests additional claim retrieval controls.

## Registration-ready checklist per environment

- Confirm BASE_URL is final and publicly reachable for that environment.
- Confirm Redirect URL and Post Logout Redirect URL are whitelisted in CanadaLogin.
- Confirm Post Logout Redirect URL entries match exactly (scheme, host, path) and do not rely on query parameters.
- Confirm Back-channel logout URL is reachable by CanadaLogin.
- Confirm OIDC_CLIENT_ID is correct for the environment.
- Confirm OIDC_CUSTOM_DOMAIN targets the correct CanadaLogin environment.
- Confirm private_key_jwt credentials are configured for non-local environments.
- Confirm requested scopes match actual claims consumed by the application.
- Confirm sector identifier decision with privacy and integration stakeholders.

## Endpoint references in this repository

- Sign-in start: /{lang}/sign-in/send
- Callback: /sign-in/receive
- Provider logout start: /{lang}/sign-in/oidc-logout
- Local logout callback target: /sign-in/logout
- Back-channel logout receiver: /sign-in/back-channel-logout

## Source references

- Auth configuration and environment policy: ../sst.config.ts
- Auth core and token exchange behavior: ../packages/web-app/src/lib/utils/auth/sign-in-core.server.ts
- Back-channel logout verification: ../packages/web-app/src/lib/utils/auth/sign-in-back-channel.server.ts
- Back-channel logout route: ../packages/web-app/src/routes/sign-in/back-channel-logout/+server.ts
- Operational auth docs: ../README.md
- Suggested app names (EN/FR): ../packages/web-app/src/lib/utils/metadata.ts
- Production host evidence: ../packages/web-app/src/lib/components/footer/i18n/en/links.json
