# CanadaLogin OIDC RP Submission Answers Sheet

Date: 2026-05-29
Purpose: copy/paste-ready answers for the CanadaLogin relying party registration form.

## Environment: Test

- CanadaLogin environment: Test
- Name of application/service (English): Geospatial Data Catalog
- Name of application/service (French): Catalogue de données géospatiales
- Application environment URL (English): https://app-dev.geo.ca/en-ca
- Application environment URL (French): https://app-dev.geo.ca/fr-ca
- Redirect URL(s):
  - http://localhost:8080/sign-in/receive
  - https://app-dev.geo.ca/sign-in/receive (optional)
- Post Logout Redirect URL(s):
  - http://localhost:8080/sign-in/logout
  - https://app-dev.geo.ca/sign-in/logout (optional)
- Logout mode: Back-channel logout (Preferred)
- Logout request URL:
  - http://localhost:8080/sign-in/back-channel-logout
  - https://app-dev.geo.ca/sign-in/back-channel-logout (optional)
- Client type: Confidential Client
- Authentication flow: Authorization Code Flow (response_type=code)
- Authentication method:
  - Preferred/target: private_key_jwt
  - Current compatibility fallback: client_secret_post on localhost only
  - Environments with strict private_key_jwt: staging and production (no non-local fallback)
  - JWKS sharing method: Offline exchange (public key/certificate)
- Requested scopes:
  - Required baseline: openid
  - Optional if required by product/compliance: profile, email, phone, language
- Sector identifier: https://app-dev.geo.ca
- Share user pairwise identifiers with another app: No
- Migration sector identifier URL: Not applicable

### Proof Key for Code Exchange (PKCE)

Proof Key for Code Exchange (PKCE) helps prevent authorization code interception attacks.

- Does your application support PKCE: Yes
- Supported PKCE hashing algorithms: S256
- Other PKCE hashing algorithms: No

### Digital Signatures

- RP Messages (Message Signing):
  - Request Object: No
  - Token Endpoint client_assertion: Yes
  - Supported signature algorithms: RS256
- CanadaLogin Messages (Signature Validation):
  - ID Token: Yes
  - UserInfo Endpoint: No
  - Supported signature algorithms: RS256

### Encryption

- RP Messages (Encryption): No
- CanadaLogin Messages (Decryption): No

## Environment: Staging

- CanadaLogin environment: Staging
- Name of application/service (English): Geospatial Data Catalog
- Name of application/service (French): Catalogue de données géospatiales
- Application environment URL (English): https://app-stage.geo.ca/en-ca
- Application environment URL (French): https://app-stage.geo.ca/fr-ca
- Redirect URL(s):
  - https://app-stage.geo.ca/sign-in/receive
- Post Logout Redirect URL(s):
  - https://app-stage.geo.ca/sign-in/logout
- Logout mode: Back-channel logout (Preferred)
- Logout request URL:
  - https://app-stage.geo.ca/sign-in/back-channel-logout
- Client type: Confidential Client
- Authentication flow: Authorization Code Flow (response_type=code)
- Authentication method: private_key_jwt (strict; no non-local fallback)
- JWKS sharing method: Offline exchange (public key/certificate)
- Requested scopes:
  - Required baseline: openid
  - Optional if required by product/compliance: profile, email, phone, language
- Sector identifier: https://app-stage.geo.ca
- Share user pairwise identifiers with another app: No
- Migration sector identifier URL: Not applicable

### Proof Key for Code Exchange (PKCE)

Proof Key for Code Exchange (PKCE) helps prevent authorization code interception attacks.

- Does your application support PKCE: Yes
- Supported PKCE hashing algorithms: S256
- Other PKCE hashing algorithms: No

### Digital Signatures

- RP Messages (Message Signing):
  - Request Object: No
  - Token Endpoint client_assertion: Yes
  - Supported signature algorithms: RS256
- CanadaLogin Messages (Signature Validation):
  - ID Token: Yes
  - UserInfo Endpoint: No
  - Supported signature algorithms: RS256

### Encryption

- RP Messages (Encryption): No
- CanadaLogin Messages (Decryption): No

## Environment: Production

- CanadaLogin environment: Production
- Name of application/service (English): Geospatial Data Catalog
- Name of application/service (French): Catalogue de données géospatiales
- Application environment URL (English): https://app.geo.ca/en-ca
- Application environment URL (French): https://app.geo.ca/fr-ca
- Redirect URL(s):
  - https://app.geo.ca/sign-in/receive
- Post Logout Redirect URL(s):
  - https://app.geo.ca/sign-in/logout
- Logout mode: Back-channel logout (Preferred)
- Logout request URL:
  - https://app.geo.ca/sign-in/back-channel-logout
- Client type: Confidential Client
- Authentication flow: Authorization Code Flow (response_type=code)
- Authentication method: private_key_jwt (strict; no non-local fallback)
- JWKS sharing method: Offline exchange (public key/certificate)
- Requested scopes:
  - Required baseline: openid
  - Optional if required by product/compliance: profile, email, phone, language
- Sector identifier: https://app.geo.ca
- Share user pairwise identifiers with another app: No
- Migration sector identifier URL: Not applicable

### Proof Key for Code Exchange (PKCE)

Proof Key for Code Exchange (PKCE) helps prevent authorization code interception attacks.

- Does your application support PKCE: Yes
- Supported PKCE hashing algorithms: S256
- Other PKCE hashing algorithms: No

### Digital Signatures

- RP Messages (Message Signing):
  - Request Object: No
  - Token Endpoint client_assertion: Yes
  - Supported signature algorithms: RS256
- CanadaLogin Messages (Signature Validation):
  - ID Token: Yes
  - UserInfo Endpoint: No
  - Supported signature algorithms: RS256

### Encryption

- RP Messages (Encryption): No
- CanadaLogin Messages (Decryption): No

## Notes for form risk-roadmap questions

When the form asks whether unsupported features are on the roadmap:

- Suggested answer for current cycle: Yes, revisit if required by CanadaLogin compliance testing.
- Suggested revisit trigger: partner compliance requirement for Request Object, UserInfo, JARM, or JWE.

## Deployment contract notes

- In staging and production, `OIDC_PRIVATE_KEY_SECRET_ID` is mandatory and must be valid.
- Accepted value formats: Secrets Manager secret name/id or full secret ARN.
- Strict private_key_jwt stages fail deployment when this value is missing or malformed.

## Source docs

- docs/canadalogin-oidc-rp-registration-matrix.md
- docs/canadalogin-advanced-capabilities-assessment.md
