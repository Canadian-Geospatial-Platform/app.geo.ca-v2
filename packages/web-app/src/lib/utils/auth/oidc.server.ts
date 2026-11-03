import { createHash, createPublicKey, randomUUID } from 'node:crypto';
import type { OpenIdConfiguration } from '#lib/utils/auth/jwt-types.js';

const OPENID_CONFIGURATION_PATHS = ['/.well-known/openid-configuration', '/oauth2/.well-known/openid-configuration'];
const OPENID_CONFIGURATION_CACHE_TTL_MS = 5 * 60 * 1000;

const openIdConfigurationCache = new Map<string, { value: OpenIdConfiguration; fetchedAt: number }>();

type DiscoveryAttempt = { path: string; status: number | null; error?: string };
type ParsedPrivateKeySecret = { pem: string; certPem: string | null; x5tS256: string | null };

/**
 * Removes a trailing slash from URLs to avoid double-slash endpoint joins.
 *
 * @param url - Base URL value.
 * @returns URL without trailing slash.
 */
export function ensureTrailingSlashless(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Reports whether a URL uses HTTPS, or plain HTTP against localhost/127.0.0.1 for local dev only.
 *
 * Used to fail closed against any accidental plaintext fallback to CanadaLogin endpoints (DR8).
 *
 * @param url - URL to check.
 * @returns True when the URL is HTTPS, or HTTP against localhost.
 */
export function isHttpsOrLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return true;
    }
    return parsed.protocol === 'http:' && isLocalhostUrl(url);
  } catch {
    return false;
  }
}

/**
 * Reports whether a URL's host is localhost or 127.0.0.1, regardless of protocol.
 *
 * @param url - URL to check.
 * @returns True when the URL targets localhost.
 */
export function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Reads OIDC settings from the server environment.
 *
 * @returns Client id, client secret, and normalized custom domain.
 */
export function getOidcConfig(): { clientId: string; clientSecret: string; customDomain: string; tokenEndpoint: string; jwtKid: string } {
  const clientId = process.env.OIDC_CLIENT_ID ?? '';
  const clientSecret = process.env.OIDC_CLIENT_SECRET ?? '';
  const customDomain = ensureTrailingSlashless(process.env.OIDC_CUSTOM_DOMAIN ?? '');
  const tokenEndpoint = (process.env.OIDC_TOKEN_ENDPOINT ?? '').trim();
  const jwtKid = process.env.OIDC_JWT_KID ?? '';

  return { clientId, clientSecret, customDomain, tokenEndpoint, jwtKid };
}

/**
 * Reads public OIDC settings (without secret) from the server environment.
 *
 * @returns Client id and normalized custom domain.
 */
export function getOidcPublicConfig(): { clientId: string; customDomain: string } {
  const { clientId, customDomain } = getOidcConfig();
  return { clientId, customDomain };
}

/**
 * Reads client id and custom domain, failing when either is missing.
 *
 * Replaces the repeated `getOidcConfig()` + `!clientId || !customDomain` guard
 * used by callers that only need the minimal OIDC identity.
 *
 * @returns Client id and normalized custom domain, or null when not configured.
 */
export function getOidcMinimalConfigOrFail(): { clientId: string; customDomain: string } | null {
  const { clientId, customDomain } = getOidcConfig();
  return clientId && customDomain ? { clientId, customDomain } : null;
}

/**
 * Builds the CanadaLogin management URL for the configured deployment stage.
 *
 * @returns HTTPS management URL with the RP client identifier, or null when incomplete.
 */
export function getOidcManageUrl(): string | null {
  const { clientId } = getOidcConfig();
  const baseUrl = (process.env.OIDC_MANAGE_BASE_URL ?? '').trim().replace(/\/$/, '');
  if (!clientId || !baseUrl || !isHttpsOrLocalhostUrl(baseUrl)) {
    return null;
  }

  return `${baseUrl}/?rp_client_id=${encodeURIComponent(clientId)}`;
}

/**
 * Tries each supported discovery path and keeps the most complete successful response.
 *
 * @param customDomain - Normalized provider domain.
 * @returns The best available configuration and fetch attempts for diagnostics.
 */
async function fetchOpenIdConfiguration(
  customDomain: string
): Promise<{ configuration: OpenIdConfiguration | null; attempts: DiscoveryAttempt[] }> {
  let configuration: OpenIdConfiguration | null = null;
  const attempts: DiscoveryAttempt[] = [];

  for (const path of OPENID_CONFIGURATION_PATHS) {
    try {
      const response = await fetch(`${customDomain}${path}`);
      attempts.push({ path, status: response.status });
      if (!response.ok) {
        continue;
      }

      const candidate = (await response.json()) as OpenIdConfiguration;
      // Retain a partial response as fallback, but keep searching for a complete one.
      configuration ??= candidate;
      if (candidate.issuer && candidate.jwks_uri) {
        configuration = candidate;
        break;
      }
    } catch (error) {
      // A failed path should not prevent trying the provider's alternate discovery URL.
      attempts.push({
        path,
        status: null,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }

  return { configuration, attempts };
}

/**
 * Fetches the provider's OIDC discovery document with a short-lived cache.
 *
 * @param customDomain - Normalized provider domain.
 * @returns Discovery document when available; otherwise null.
 */
export async function getOpenIdConfiguration(customDomain: string): Promise<OpenIdConfiguration | null> {
  if (!customDomain) {
    return null;
  }

  if (!isHttpsOrLocalhostUrl(customDomain)) {
    console.error('[auth/discovery] insecure_custom_domain_rejected', {
      endpointCategory: 'discovery',
      customDomain,
    });
    return null;
  }

  const telemetry = {
    correlationId: randomUUID(),
    endpointCategory: 'discovery',
    providerHost: (() => {
      try {
        return new URL(customDomain).host;
      } catch {
        return null;
      }
    })(),
  };

  const now = Date.now();
  const cached = openIdConfigurationCache.get(customDomain);
  if (cached && now - cached.fetchedAt < OPENID_CONFIGURATION_CACHE_TTL_MS) {
    return cached.value;
  }

  const { configuration, attempts } = await fetchOpenIdConfiguration(customDomain);

  if (!configuration) {
    console.error('[auth/discovery] openid_configuration_unavailable', {
      ...telemetry,
      attempts,
    });
    return null;
  }

  if (!configuration.issuer || !configuration.jwks_uri) {
    console.error('[auth/discovery] openid_configuration_partial', {
      ...telemetry,
      attempts,
      hasIssuer: Boolean(configuration.issuer),
      hasJwksUri: Boolean(configuration.jwks_uri),
    });
  }

  openIdConfigurationCache.set(customDomain, { value: configuration, fetchedAt: now });
  return configuration;
}

/**
 * Fetches OIDC discovery and validates the issuer/JWKS endpoints are present and secure.
 *
 * Shared by ID token and back-channel logout token verification so both fail closed
 * against an incomplete or insecure discovery document (DR8).
 *
 * @param customDomain - Normalized provider domain.
 * @returns Normalized issuer and JWKS URI, or null when discovery is missing/insecure.
 */
export async function resolveVerifiedDiscovery(customDomain: string): Promise<{ issuer: string; jwksUri: string } | null> {
  const discovery = await getOpenIdConfiguration(customDomain);
  const issuer = discovery?.issuer ? ensureTrailingSlashless(discovery.issuer) : null;
  const jwksUri = discovery?.jwks_uri ?? null;

  if (!issuer || !jwksUri || !isHttpsOrLocalhostUrl(issuer) || !isHttpsOrLocalhostUrl(jwksUri)) {
    return null;
  }

  return { issuer, jwksUri };
}

/**
 * Fetches a secret value from AWS Secrets Manager.
 *
 * Used to retrieve the private key for private_key_jwt client authentication.
 * Only available in production environments with AWS credentials configured.
 *
 * @param secretId - Secret identifier (name or ARN) in Secrets Manager
 * @returns Secret string value when successful; null on error
 */
export async function fetchSecretFromSecretsManager(secretId: string): Promise<string | null> {
  const telemetry = {
    correlationId: randomUUID(),
    endpointCategory: 'secrets_manager',
    hasSecretId: Boolean(secretId),
  };

  try {
    // Dynamically import AWS SDK only when needed (production/server-side only)
    const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');

    const client = new SecretsManagerClient();
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await client.send(command);

    return response.SecretString ?? null;
  } catch (error) {
    console.error('[auth/secrets-manager] secret_fetch_failed', {
      ...telemetry,
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    return null;
  }
}

const privateKeyCache = new Map<
  string,
  {
    value: { pem: string; x5tS256: string | null };
    fetchedAt: number;
  }
>();
const PRIVATE_KEY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Computes the x5t#S256 thumbprint (base64url SHA-256 of DER bytes) from a PEM certificate.
 */
function computeX5tS256(certPem: string): string | null {
  try {
    const base64 = certPem
      .replace(/-----BEGIN CERTIFICATE-----/, '')
      .replace(/-----END CERTIFICATE-----/, '')
      .replace(/\s/g, '');
    const derBytes = Buffer.from(base64, 'base64');
    return createHash('sha256').update(derBytes).digest().toString('base64url');
  } catch {
    return null;
  }
}

/**
 * Derives the PEM-encoded SPKI public key from a PEM private key.
 *
 * @param privateKeyPem - PEM private key text (PKCS8 or PKCS1 RSA).
 * @returns PEM SPKI public key when derivation succeeds; otherwise null.
 */
function publicKeyFromPrivateKeyPem(privateKeyPem: string): string | null {
  try {
    return createPublicKey(privateKeyPem).export({ format: 'pem', type: 'spki' }).toString();
  } catch {
    return null;
  }
}

/**
 * Derives the PEM-encoded SPKI public key from a PEM X.509 certificate.
 *
 * @param certPem - PEM certificate text.
 * @returns PEM SPKI public key when derivation succeeds; otherwise null.
 */
function publicKeyFromCertificatePem(certPem: string): string | null {
  try {
    return createPublicKey(certPem).export({ format: 'pem', type: 'spki' }).toString();
  } catch {
    return null;
  }
}

/**
 * Computes a base64url SHA-256 fingerprint of an SPKI public key.
 *
 * Used only for diagnostics when key/certificate mismatch is detected.
 *
 * @param publicKeyPem - PEM SPKI public key text.
 * @returns Base64url SHA-256 digest string, or null when input/parse fails.
 */
function computeSpkiSha256(publicKeyPem: string | null): string | null {
  if (!publicKeyPem) {
    return null;
  }

  try {
    const der = createPublicKey(publicKeyPem).export({ format: 'der', type: 'spki' }) as Buffer;
    return createHash('sha256').update(der).digest().toString('base64url');
  } catch {
    return null;
  }
}

/**
 * Normalizes secret payload values that may be nested/encoded as JSON strings,
 * arrays of PEM lines, or objects with alternate key names.
 */
function normalizeSecretTextValue(value: unknown, nestedKeys: string[]): string | null {
  let current: unknown = value;

  for (let i = 0; i < 6; i += 1) {
    if (typeof current === 'string') {
      const trimmed = current.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          current = JSON.parse(trimmed);
          continue;
        } catch {
          return trimmed;
        }
      }
      return current;
    }

    if (Array.isArray(current)) {
      if (current.every((item) => typeof item === 'string')) {
        return (current as string[]).join('\n');
      }
      return null;
    }

    if (current && typeof current === 'object') {
      const record = current as Record<string, unknown>;
      const next = nestedKeys.map((key) => record[key]).find((item) => item !== undefined);
      if (next === undefined) {
        return null;
      }
      current = next;
      continue;
    }

    return null;
  }

  return typeof current === 'string' ? current : null;
}

/**
 * Normalizes PEM text that may contain escaped newlines.
 *
 * @param value - PEM text to normalize.
 * @returns Trimmed PEM text with escaped newlines expanded.
 */
function normalizePemText(value: string): string {
  return (value.includes('\\n') ? value.replace(/\\n/g, '\n') : value).trim();
}

/**
 * Parses supported Secrets Manager payloads and derives an optional certificate thumbprint.
 *
 * @param secretString - Raw secret value returned by Secrets Manager.
 * @param secretId - Secret identifier used in diagnostic logs.
 * @returns Normalized key and certificate data, or null when the key payload is invalid.
 */
function parsePrivateKeySecret(secretString: string, secretId: string): ParsedPrivateKeySecret | null {
  let pem = secretString;
  let certPem: string | null = null;
  let x5tS256: string | null = null;

  if (secretString.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(secretString) as Record<string, unknown>;
      const rawKeyValue = parsed['privateKey'] ?? parsed['private_key'] ?? parsed['key'];
      const normalizedPem = normalizeSecretTextValue(rawKeyValue, ['privateKey', 'private_key', 'key', 'value']);
      if (!normalizedPem) {
        console.error('[auth/private-key] Could not normalize private key payload', { secretId });
        return null;
      }
      pem = normalizedPem;

      // Prefer a key-nested certificate so the key and thumbprint come from the same payload.
      const certFromNestedKeyPayload = normalizeSecretTextValue(rawKeyValue, ['certificate', 'cert', 'value']);
      const certFromTopLevelPayload = normalizeSecretTextValue(parsed['certificate'] ?? parsed['cert'], ['certificate', 'cert', 'value']);
      certPem = certFromNestedKeyPayload ?? certFromTopLevelPayload;

      if (certFromNestedKeyPayload && certFromTopLevelPayload && certFromNestedKeyPayload !== certFromTopLevelPayload) {
        console.warn('[auth/private-key] Nested and top-level certificates differ; using nested certificate', { secretId });
      }

      if (certPem) {
        certPem = normalizePemText(certPem);
        x5tS256 = computeX5tS256(certPem);
      }
    } catch {
      // If JSON parsing fails, preserve support for a raw PEM secret.
      pem = secretString;
      certPem = null;
    }
  }

  pem = normalizePemText(pem);
  if (!pem.startsWith('-----BEGIN') || (!pem.endsWith('-----END PRIVATE KEY-----') && !pem.endsWith('-----END RSA PRIVATE KEY-----'))) {
    console.error('[auth/private-key] Private key format invalid', {
      secretId,
      startsCorrectly: pem.startsWith('-----BEGIN'),
      endsCorrectly: pem.endsWith('-----END PRIVATE KEY-----') || pem.endsWith('-----END RSA PRIVATE KEY-----'),
    });
    return null;
  }

  return { pem, certPem, x5tS256 };
}

/**
 * Rejects a certificate only when both public keys are readable and do not match.
 *
 * @param pem - Normalized private key.
 * @param certPem - Optional normalized certificate.
 * @param secretId - Secret identifier used in diagnostic logs.
 * @returns False only when both public keys are readable and differ.
 */
function hasMatchingCertificate(pem: string, certPem: string | null, secretId: string): boolean {
  if (!certPem) {
    return true;
  }

  const privateKeyPublicKey = publicKeyFromPrivateKeyPem(pem);
  const certificatePublicKey = publicKeyFromCertificatePem(certPem);
  if (!privateKeyPublicKey || !certificatePublicKey || privateKeyPublicKey === certificatePublicKey) {
    return true;
  }

  console.error('[auth/private-key] Private key and certificate do not form a matching pair', {
    secretId,
    hasPrivateKeyPublicKey: true,
    hasCertificatePublicKey: true,
    privateKeySpkiSha256: computeSpkiSha256(privateKeyPublicKey),
    certificateSpkiSha256: computeSpkiSha256(certificatePublicKey),
  });
  return false;
}

/**
 * Retrieves the OIDC client private key and optional certificate thumbprint for private_key_jwt authentication.
 *
 * The Secrets Manager secret may be either:
 * - A raw PEM private key string
 * - A JSON object with `privateKey` (PEM) and optionally `certificate` (PEM) fields
 *
 * When a certificate is present, the `x5t#S256` thumbprint is computed and returned
 * for inclusion in the client_assertion JWT header.
 *
 * Returns null pem (falling back to client_secret_post) when either:
 * - `OIDC_USE_PRIVATE_KEY_JWT` is not set to `"true"`, or
 * - `OIDC_PRIVATE_KEY_SECRET_ID` is not configured.
 */
export async function getPrivateKeyMaterial(): Promise<{ pem: string; x5tS256: string | null } | null> {
  const usePrivateKeyJwt = (process.env.OIDC_USE_PRIVATE_KEY_JWT ?? '').toLowerCase() === 'true';
  const secretId = process.env.OIDC_PRIVATE_KEY_SECRET_ID;

  if (!usePrivateKeyJwt || !secretId) {
    return null;
  }

  // Check cache first, but validate it's a valid PEM key
  const now = Date.now();
  const cached = privateKeyCache.get(secretId);
  if (cached && now - cached.fetchedAt < PRIVATE_KEY_CACHE_TTL_MS) {
    // Validate cached key is actually a PEM (starts with -----BEGIN)
    if (cached.value.pem && cached.value.pem.trim().startsWith('-----BEGIN')) {
      return cached.value;
    } else {
      // Cache contains malformed data, invalidate and refetch
      privateKeyCache.delete(secretId);
    }
  }

  const secretString = await fetchSecretFromSecretsManager(secretId);
  if (!secretString) {
    return null;
  }

  const parsedSecret = parsePrivateKeySecret(secretString, secretId);
  if (!parsedSecret || !hasMatchingCertificate(parsedSecret.pem, parsedSecret.certPem, secretId)) {
    return null;
  }

  const material = { pem: parsedSecret.pem, x5tS256: parsedSecret.x5tS256 };
  privateKeyCache.set(secretId, { value: material, fetchedAt: now });
  return material;
}
