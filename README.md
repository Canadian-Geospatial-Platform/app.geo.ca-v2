# App.geo.ca-v2

This project uses the [SvelteKit](https://kit.svelte.dev/) framework and [SST](https://sst.dev/) to build and deploy to AWS a full-stack application for searching and cataloging geospatial data.

## Setup

- Create a fork of the app.geo.ca-v2 repo for your personal development environment.
- Clone the repo in your dev environment using the following command in a new Linux terminal: `git clone <Your-forked-repo-url>`.
- Check to make sure Node.js, npm, and nvm are installed with these commands:
  - `node -v`
  - `npm -v`
  - `nvm -v`
- If you get an error message for any of these commands, you will have to install the packages with these steps:
  - First install curl as a sudo user: `sudo apt-get install curl`.
  - Next install nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash`.
  - Test to make sure nvm installed successfully: `command -v nvm`. Note: If successful, `nvm` will print. If nothing happens or an error is received, close and open a new terminal.
  - Next, install a Node.js LTS version and npm: `nvm install --lts`. This repository does not currently include an `.nvmrc` file.
  - Confirm node and npm were installed: `node -v` and `npm -v`.
  - See [nvm](https://github.com/nvm-sh/nvm) for version management.
- Navigate to your project's directory: `cd app.geo.ca-v2`. Note: the name of your directory may differ based on the name of your forked repo.
- Install the root package and web-app workspace dependencies from the repository root with: `npm install`.

### SST adapter compatibility

The app uses SvelteKit 3 and the pinned `svelte-kit-sst@3.0.0` adapter. Both Vite configurations use
[a compatibility wrapper](packages/web-app/scripts/svelte-kit-sst.js) that removes the adapter's obsolete
`@sveltejs/kit/node/polyfills` import and initialization from the generated Lambda handler on every build.
SST's default Node.js 24 Lambda runtime provides these APIs natively. The wrapper fails explicitly if the
upstream handler changes; review or remove it when updating the adapter. Do not edit the generated
`.svelte-kit` output or `node_modules` to fix this incompatibility.

## Developing

After following the setup, start a development server with these steps:

- Set up your AWS credentials. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- For local dev, staging or production, copy the matching template from .env.example to `.env.dev`, `.env.staging` or `.env.production` and replace every placeholder.
- Keep staging and production credentials separate, including the `private_key_jwt` key in AWS Secrets Manager and `SESSION_COOKIE_SECRET`. The `.env.example` file is a safe template; never commit the real `.env.staging` or `.env.production` files.
- `packages/web-app/.env` is an optional local override file for web-app runtime values read from `process.env` (for example `GEOCORE_API_DOMAIN`, `SEMANTIC_SEARCH_URL`, and `USER_TABLE_NAME`).
- Keep auth/stage settings (`OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_CUSTOM_DOMAIN`) in your stage env file at the repository root (for example `.env.dev`).
- Optional scope policy setting: `OIDC_REQUESTED_SCOPES` (space/comma delimited; supported: `openid`, `profile`, `email`, `phone`, `language`).
- Optional CanadaLogin account-management link: set `OIDC_MANAGE_BASE_URL` to the HTTPS management base URL for the selected provider environment. The link is hidden when this setting or the client ID is missing.
- `packages/web-app/.env` is ignored by git and should stay local to your machine.
- Set the values for `OIDC_CLIENT_ID` and `OIDC_CLIENT_SECRET` from your OIDC app client.
- Set `OIDC_CUSTOM_DOMAIN` to the base auth host only (no `/oauth2` suffix), for example `https://auth.login-connexion.alpha.canada.ca`.
- If `OIDC_REQUESTED_SCOPES` is not set, the app defaults to `openid`.
- Ensure login and logout URLs are configured in your OIDC provider app client (CanadaLogin/Cognito).
  - Allowed callback URLs.
    - http://localhost:8080/sign-in/receive
  - Allowed sign-out URLs.
    - http://localhost:8080/sign-in/logout
  - Back-channel logout URL.
    - http://localhost:8080/sign-in/back-channel-logout
- Local sign-out skips provider logout and clears app cookies directly to avoid back-channel logout failures against localhost.

- For local development, run `npm run dev` from the repository root. SST v4 starts the multiplexer and frontend together.

### OIDC Authentication: client_secret_post vs. private_key_jwt

**Local development** uses `client_secret_post` authentication, where the client sends `OIDC_CLIENT_SECRET` in the token request body. This is simpler for local setup without requiring AWS infrastructure.

**Staging and production** use `private_key_jwt` authentication (RFC 7523), where the client signs a JWT with a private key and sends it as a client assertion. This is more secure and avoids transmitting secrets in request bodies.

When `OIDC_USE_PRIVATE_KEY_JWT=true`, non-local environments fail closed if a private key is unavailable. In that case, the app refuses `client_secret_post` fallback during token exchange.

#### Staging/Production: Setting Up private_key_jwt

1. **Generate an RSA key pair** (one-time setup - certificate must be replaced yearly):

Run this step in Bash, Git Bash, or WSL. If you're using PowerShell, `openssl` must be installed and available on your `PATH` first.

```bash
openssl genrsa -out private-key-<prod/staging>.pem 2048
openssl req -key private-key-<prod/staging>.pem -new -x509 -days 365 -out certificate-<prod/staging>.crt
```

If `openssl` is not recognized in your shell, install OpenSSL or switch to a shell that already provides it before continuing.

PowerShell 7+ alternative:

```powershell
$rsa = [System.Security.Cryptography.RSA]::Create(2048)
Set-Content -Path private-key-<prod/staging>.pem -Value $rsa.ExportPkcs8PrivateKeyPem()
$certificateRequest = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
  'CN=oidc-private-key-jwt',
  $rsa,
  [System.Security.Cryptography.HashAlgorithmName]::SHA256,
  [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
)
$certificate = $certificateRequest.CreateSelfSigned(
  [System.DateTimeOffset]::UtcNow.AddMinutes(-5),
  [System.DateTimeOffset]::UtcNow.AddDays(365)
)
[System.IO.File]::WriteAllBytes('certificate-<prod/staging>.crt', $certificate.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert))
$certificate.Dispose()
$rsa.Dispose()
```

If you already have a PEM private key named `private.key`, the OpenSSL command provided by the OIDC provider is:

```powershell
openssl req -key private.key -new -x509 -days 365 -out certificate.crt
```

Windows note: if you want to keep using the Bash commands, install OpenSSL for Windows and make sure the `openssl` executable is on your `PATH` before running them.

The certificate must be replaced yearly.

2. **Register the key material with your OIDC provider**:

- Log into your OIDC provider console (CanadaLogin).
- In the app client settings, upload the JWT certificate from `certificate.crt` if the provider requires a certificate instead of a raw public key.
- If a partner explicitly asks for a raw public key file, export it from your private key when needed.
- Verify that `private_key_jwt` is enabled as a supported authentication method.

3. **Store the private key in AWS Secrets Manager**:

Create the secret the first time:

```bash
aws secretsmanager create-secret \
  --name <stage>/oidc/private-key \
  --secret-string file://private-key.pem \
  --region ca-central-1
```

If the secret already exists, update it with a new value:

```bash
aws secretsmanager put-secret-value \
  --secret-id <stage>/oidc/private-key \
  --secret-string file://private-key.pem \
  --region ca-central-1
```

PowerShell equivalents:

```powershell
# First-time create
aws secretsmanager create-secret `
  --name staging/oidc/private-key `
  --secret-string file://private-key.pem `
  --region ca-central-1

# Update existing secret value
aws secretsmanager put-secret-value `
  --secret-id staging/oidc/private-key `
  --secret-string file://private-key.pem `
  --region ca-central-1
```

Optional JSON secret format (recommended when your provider requires `x5t#S256`):

- The app supports storing key material as JSON with both private key and certificate.
- When `certificate` is present, the app computes `x5t#S256` from the certificate and sends it in the client assertion JWT header.

```json
{
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
}
```

If you store this JSON directly in Secrets Manager, keep embedded newlines escaped as `\\n`.

4. **Configure your staging/production deployment**:

- Create your stage env file (for example `.env.staging` or `.env.production`) with:

  ```
  OIDC_CLIENT_ID=<your-stage-client-id>
  OIDC_CUSTOM_DOMAIN=<your-stage-oidc-domain>
  OIDC_TOKEN_ENDPOINT=<your-stage-token-endpoint-url>
  OIDC_JWT_KID=<your-jwt-key-id>
  OIDC_PRIVATE_KEY_SECRET_ID=<stage>/oidc/private-key
  OIDC_USE_PRIVATE_KEY_JWT=true
  OIDC_MANAGE_BASE_URL=<stage-specific-https-canadalogin-management-base-url>
  SESSION_COOKIE_SECRET=<unique-random-secret-for-this-stage>
  AUTH_STATUS_ALLOWED_ORIGINS=https://geo.ca,https://www.geo.ca
  ```

  - `SESSION_COOKIE_SECRET` is required for staging and production. Generate a unique value for each stage (for example, `openssl rand -base64 32`) and provide it through the stage environment; never commit the value.
  - `AUTH_STATUS_ALLOWED_ORIGINS` is an optional comma-separated list of exact HTTPS origins allowed to call `/api/auth-status` with cookies. Production defaults to `https://geo.ca,https://www.geo.ca`; configure the static-site origin for staging as needed.
  - `OIDC_CLIENT_SECRET` is optional when `private_key_jwt` is enabled and key material is configured.
  - `OIDC_TOKEN_ENDPOINT` is optional; defaults to `<OIDC_CUSTOM_DOMAIN>/oauth2/token`. Set this when your provider requires a different token endpoint path (e.g., `/v1.0/endpoint/default/token`).
  - `OIDC_JWT_KID` (Key ID) is optional; when provided, it's included in the JWT header to help the provider identify the signing key (e.g., `staging-nrcan-geoca-signer`).
  - `OIDC_PRIVATE_KEY_SECRET_ID` may be set as either a secret name/id (for example `<stage>/oidc/private-key`) or a full Secrets Manager ARN.
  - `OIDC_MANAGE_BASE_URL` is optional and should match the CanadaLogin management portal for the selected environment; it controls the signed-in account-management link.
  - Staging/production deployments fail fast when private_key_jwt is enforced and `OIDC_PRIVATE_KEY_SECRET_ID` is missing or malformed.
  - The app only fetches the private key from Secrets Manager when `OIDC_USE_PRIVATE_KEY_JWT=true`.
  - Leave `OIDC_USE_PRIVATE_KEY_JWT` unset or `false` in `.env.dev` to keep local development on `client_secret_post`.

#### Reading sign-in status from the static `geo.ca` site

The static site cannot read or validate the authentication cookie itself. The cookie is `HttpOnly`; instead, call the app's status endpoint from the browser and let `app.geo.ca` validate the session. For example, add an element for the sign-in state:

```html
<span id="sign-in-status" aria-live="polite"></span>
```

Then load this script on `https://geo.ca` (or `https://www.geo.ca`):

```html
<script>
  async function updateSignInStatus() {
    const status = document.getElementById("sign-in-status");
    if (!status) return;

    try {
      const response = await fetch("https://app.geo.ca/api/auth-status", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 503) {
        status.textContent = "Sign-in status is temporarily unavailable.";
        return;
      }

      if (!response.ok) {
        status.textContent = "Unable to check sign-in status.";
        return;
      }

      const result = await response.json();
      status.textContent = result.signedIn ? "Signed in" : "Not signed in";
    } catch (error) {
      console.error("Unable to check sign-in status", error);
      status.textContent = "Unable to check sign-in status.";
    }
  }

  updateSignInStatus();
</script>
```

`credentials: 'include'` is essential: it asks the browser to send eligible cookies to `app.geo.ca`. The app's auth cookies must be scoped to `geo.ca`, and users must already have signed in through the app. Since this is a cross-origin request, the app must allow the page's **exact origin** in `AUTH_STATUS_ALLOWED_ORIGINS` (for example, `https://geo.ca`; include `https://www.geo.ca` too if the page is served there). The endpoint returns `{ "signedIn": true }` or `{ "signedIn": false }`; `503` means the server could not verify the status, while a network/CORS failure means the page should treat status as unknown, not as signed out. The response is marked `Cache-Control: no-store`.

The browser sends the cookie, but static-site JavaScript never receives or inspects it. Do not copy cookie values into JavaScript, expose tokens, or use `mode: 'no-cors'` (which prevents reading the response).

5. **Deploy**:

```bash
npx sst deploy --stage production
```

The Lambda execution role receives automatic permission to read the secret from Secrets Manager.

#### Local Development: Staying on client_secret_post

- `.env.dev` should **not** set `OIDC_USE_PRIVATE_KEY_JWT` or `OIDC_PRIVATE_KEY_SECRET_ID`.
- Sign-in will use `client_secret_post` with `OIDC_CLIENT_SECRET`.
- No AWS Secrets Manager calls are made on localhost.
- Localhost (`localhost` / `127.0.0.1`) is the only environment where `client_secret_post` fallback remains permitted while `OIDC_USE_PRIVATE_KEY_JWT=true`.

- Port cleanup behavior: before frontend dev starts, `/packages/web-app/scripts/kill-port.js` runs via `predev` and force-kills listeners on port `8080`.
- Warning: this can terminate any application currently using port `8080`, not just this project.
- Validate restored sign-in flow:
  - As a guest, favourite one or more records.
  - Click Sign in and complete authentication.
  - Confirm guest favourites are merged into the signed-in profile.
  - Confirm Sign out clears session and returns to map browser.
- Optional DB diagnostics (non-production only): open `/api/health/db` and confirm `tableAccessible: true`.
- For deployment, run `npx sst deploy --stage <yourStageName>`. You will need to deploy your environment in order to build any AWS resources like buckets and tables.
- Now run the steps under [## Importing Data](#importing-data).

## Auth Flow Endpoints

CanadaLogin registration worksheet:

- See `docs/canadalogin-oidc-rp-registration-matrix.md` for environment-by-environment form values and submission checklist.
- See `docs/canadalogin-advanced-capabilities-assessment.md` for optional advanced OIDC/JOSE capability posture and recommendations.
- See `docs/canadalogin-oidc-rp-submission-answers.md` for copy/paste form answers by environment.

Core auth routes used by the app:

- `/${lang}/sign-in/send`: starts OIDC sign-in (PKCE + nonce), then redirects to the provider authorize URL.
- `/sign-in/receive`: handles the provider callback, verifies ID token claims/signature, stores auth cookies, and merges guest favourites.
- `/${lang}/sign-in/oidc-logout`: redirects to provider logout when applicable.
- `/${lang}/sign-in/logout` and `/sign-in/logout`: clear local auth cookies and redirect to map browser.
- `/sign-in/back-channel-logout`: receives provider back-channel logout notifications and stores revocation markers server-side.
- `/sign-in/front-channel-logout`: clears local auth cookies when the provider initiates front-channel logout.
- `/api/session`: reports the current session expiry (`GET`) and refreshes the session (`POST`).

Session invalidation behavior:

- Front-channel logout clears browser cookies immediately.
- Back-channel logout updates a per-session revocation marker when the provider supplies a `sid`, or a user-wide `authRevokedAt` marker otherwise.
- Back-channel logout tracks the most recent logout token `jti` and rejects duplicate `jti` values within a ten-minute replay window.
- On subsequent reads, token `iat` is compared with the applicable revocation marker; revoked sessions are treated as signed out and cookies are cleared.

Auth telemetry behavior:

- Token exchange, OIDC discovery, JWKS fetch/signature verification, and ID token verification failures emit structured server logs with a correlation id, endpoint category, and non-sensitive diagnostics.

UserInfo endpoint posture:

- The current auth flow uses verified ID token claims and does not call the OIDC UserInfo endpoint.
- This should be revisited only if CanadaLogin compliance testing or product requirements require UserInfo-specific claims.

## User Data Model

For signed-in users, the DynamoDB users table stores:

- `uuid`: stable user identifier from the auth token (`sub`, with `username` fallback).
- `favourites`: array of dataset record ids saved by the user.
- `mapConfigs`: array of saved map configurations for the Maps tab in Favourites.
- `authRevokedAt`: server-side revocation marker (token `iat` threshold) used for back-channel logout.
- `authRevokedSids`: per-session revocation timestamps when the provider supplies a session ID.
- `lastBackChannelLogoutJti` and `lastBackChannelLogoutJtiSeenAt`: recent logout-token replay tracking.

Not stored by current app code:

- OIDC tokens or session secrets; the separately signed session cookie contains its own session metadata.
- User profile attributes such as email or display name.

Guest favourites are stored in browser local storage. When a guest starts sign-in, the list is copied into the short-lived `guest_favourites` cookie and merged into the signed-in user's `favourites` list after authentication.

Favourites feature routes:

- `/${lang}/favourites`: Landing page (hub) for signed-in users; displays cards to navigate to datasets and maps sections.
- `/${lang}/favourites/datasets`: Displays list of saved dataset records with options to delete or view on the map.
- `/${lang}/favourites/maps`: Displays list of saved map configurations with options to upload, download, delete, or view on the map.
- `/${lang}/favourites/view`: Shared map viewer for displaying selected datasets (by record IDs) or a single saved map configuration (by mapId).
- `/[lang]/api/favourites`: RESTful API endpoints (POST/DELETE/PUT/PATCH) for favourites and map config mutations.

Data persistence:

- Dataset favourites: array of record IDs stored in `UserData.favourites`.
- Saved map configs: array of `MapConfigFavourite` objects stored in `UserData.mapConfigs` (max 25 configs; each config size-limited to stay within 300KB DynamoDB item limit).

## Building and deploying

- Set up your AWS credentials for the desired environment. [documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- Create a stage env file by copying `.env.example` to `.env.<your-stage-name>`.
- Keep auth/stage settings (`OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_CUSTOM_DOMAIN`) in the root stage env file for the deployment target.
- `packages/web-app/.env` remains optional local-only overrides for web-app runtime values and is git-ignored.
- From the repository root, run `npm install` to install the root package and web-app workspace dependencies.
- Ensure login and logout URLs are configured in your OIDC provider app client.
  - Example allowed callback URLs.
    - https://d28mialgy1tfmv.cloudfront.net/sign-in/receive
  - Example allowed sign-out URLs.
    - https://d28mialgy1tfmv.cloudfront.net/sign-in/logout
  - Post logout redirect URLs must be exact allowlist matches (no extra query params).
  - Example back-channel logout URL.
    - https://d28mialgy1tfmv.cloudfront.net/sign-in/back-channel-logout

- Deploy from the root of the repository: `npx sst deploy --stage <yourStageName>`.

### Staging Go/No-Go Check

Before deploying or validating sign-in in staging, run the automated preflight check:

- `npm run check-staging`

Optional flags:

- `npm run check-stage -- --stage <yourStageName>`
- `npm run check-stage -- --stage staging --base-url https://<your-cloudfront-domain>`
- `npm run check-stage -- --stage staging --base-url https://<your-cloudfront-domain> --region ca-central-1`

What this validates:

- Required env values exist in `.env.<stage>`.
- `OIDC_CUSTOM_DOMAIN` is host-only (no path like `/oauth2`).
- `OIDC_PRIVATE_KEY_SECRET_ID` format is valid.
- AWS credentials are usable (`sts get-caller-identity`).
- The OIDC private key secret is accessible in Secrets Manager.
- Outputs callback/logout URLs to confirm provider allowlist configuration.

If any blocker is found, the script exits with a non-zero status and prints `RESULT: NO-GO`.

## Importing Data

The app reads already-prepared GeoCore record JSON files from S3. For a record with UUID `<uuid>`, it expects the file at `geocore/<uuid>.geojson` in the stage's HNAP bucket, with content matching the `GeospatialRecord` shape consumed by the application.

The HNAP-to-GeoCore conversion trigger is not currently deployed by this repository (`hnap-bridge` has been removed). Uploading source files under `hnap/` does not generate records. Prepare/convert the records using your data pipeline, then upload the resulting files under the `geocore/` prefix. A record without its corresponding file will not load from S3.
