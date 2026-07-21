import { createHash, createPublicKey, randomUUID } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { OpenIdConfiguration } from '$lib/utils/auth/jwt-types';

const OPENID_CONFIGURATION_PATHS = ['/.well-known/openid-configuration', '/oauth2/.well-known/openid-configuration'];
const OPENID_CONFIGURATION_CACHE_TTL_MS = 5 * 60 * 1000;

const openIdConfigurationCache = new Map<string, { value: OpenIdConfiguration; fetchedAt: number }>();

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
 * Reads OIDC settings from the server environment.
 *
 * @returns Client id, client secret, and normalized custom domain.
 */
export function getOidcConfig(): { clientId: string; clientSecret: string; customDomain: string; tokenEndpoint: string; jwtKid: string } {
  const clientId = env.OIDC_CLIENT_ID ?? process.env.OIDC_CLIENT_ID ?? '';
  const clientSecret = env.OIDC_CLIENT_SECRET ?? process.env.OIDC_CLIENT_SECRET ?? '';
  const customDomain = ensureTrailingSlashless(env.OIDC_CUSTOM_DOMAIN ?? process.env.OIDC_CUSTOM_DOMAIN ?? '');
  const tokenEndpoint = (env.OIDC_TOKEN_ENDPOINT ?? process.env.OIDC_TOKEN_ENDPOINT ?? '').trim();
  const jwtKid = env.OIDC_JWT_KID ?? process.env.OIDC_JWT_KID ?? '';

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
 * Fetches the provider's OIDC discovery document with a short-lived cache.
 *
 * @param customDomain - Normalized provider domain.
 * @returns Discovery document when available; otherwise null.
 */
export async function getOpenIdConfiguration(customDomain: string): Promise<OpenIdConfiguration | null> {
  if (!customDomain) {
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

  let bestConfiguration: OpenIdConfiguration | null = null;
  const attempts: Array<{ path: string; status: number | null; error?: string }> = [];

  for (const path of OPENID_CONFIGURATION_PATHS) {
    try {
      const response = await fetch(`${customDomain}${path}`);
      if (!response.ok) {
        attempts.push({ path, status: response.status });
        continue;
      }

      const configuration = (await response.json()) as OpenIdConfiguration;
      attempts.push({ path, status: response.status });
      if (!bestConfiguration) {
        bestConfiguration = configuration;
      }

      if (configuration.issuer && configuration.jwks_uri) {
        bestConfiguration = configuration;
        break;
      }
    } catch (error) {
      attempts.push({
        path,
        status: null,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      // Continue trying alternate discovery paths.
    }
  }

  if (!bestConfiguration) {
    console.error('[auth/discovery] openid_configuration_unavailable', {
      ...telemetry,
      attempts,
    });
    return null;
  }

  if (!bestConfiguration.issuer || !bestConfiguration.jwks_uri) {
    console.error('[auth/discovery] openid_configuration_partial', {
      ...telemetry,
      attempts,
      hasIssuer: Boolean(bestConfiguration.issuer),
      hasJwksUri: Boolean(bestConfiguration.jwks_uri),
    });
  }

  openIdConfigurationCache.set(customDomain, { value: bestConfiguration, fetchedAt: now });
  return bestConfiguration;
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
  const usePrivateKeyJwt = (env.OIDC_USE_PRIVATE_KEY_JWT ?? process.env.OIDC_USE_PRIVATE_KEY_JWT ?? '').toLowerCase() === 'true';
  const secretId = env.OIDC_PRIVATE_KEY_SECRET_ID ?? process.env.OIDC_PRIVATE_KEY_SECRET_ID;

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

  let pem: string;
  let x5tS256: string | null = null;
  let certPem: string | null = null;

  // Support JSON format: { "privateKey": "...", "certificate": "..." }
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

      // Prefer certificate embedded alongside a nested key payload so key and thumbprint stay aligned.
      const certFromNestedKeyPayload = normalizeSecretTextValue(rawKeyValue, ['certificate', 'cert', 'value']);
      const certFromTopLevelPayload = normalizeSecretTextValue(parsed['certificate'] ?? parsed['cert'], ['certificate', 'cert', 'value']);
      certPem = certFromNestedKeyPayload ?? certFromTopLevelPayload;

      if (certFromNestedKeyPayload && certFromTopLevelPayload && certFromNestedKeyPayload !== certFromTopLevelPayload) {
        console.warn('[auth/private-key] Nested and top-level certificates differ; using nested certificate', { secretId });
      }

      if (certPem) {
        if (certPem.includes('\\n')) {
          certPem = certPem.replace(/\\n/g, '\n');
        }
        certPem = certPem.trim();
        x5tS256 = computeX5tS256(certPem);
      }
    } catch {
      pem = secretString;
    }
  } else {
    pem = secretString;
  }

  // Normalise: ensure pem is a string, replace escaped newlines, trim whitespace
  if (typeof pem !== 'string') {
    console.error('[auth/private-key] Private key is not a string after parsing', { secretId, pemType: typeof pem });
    return null;
  }

  if (pem.includes('\\n')) {
    pem = pem.replace(/\\n/g, '\n');
  }
  pem = pem.trim();

  if (!pem.startsWith('-----BEGIN') || (!pem.endsWith('-----END PRIVATE KEY-----') && !pem.endsWith('-----END RSA PRIVATE KEY-----'))) {
    console.error('[auth/private-key] Private key format invalid', {
      secretId,
      startsCorrectly: pem.startsWith('-----BEGIN'),
      endsCorrectly: pem.endsWith('-----END PRIVATE KEY-----') || pem.endsWith('-----END RSA PRIVATE KEY-----'),
    });
    return null;
  }

  if (certPem) {
    const privateKeyPublicKey = publicKeyFromPrivateKeyPem(pem);
    const certificatePublicKey = publicKeyFromCertificatePem(certPem);
    const privateKeySpkiSha256 = computeSpkiSha256(privateKeyPublicKey);
    const certificateSpkiSha256 = computeSpkiSha256(certificatePublicKey);

    if (privateKeyPublicKey && certificatePublicKey && privateKeyPublicKey !== certificatePublicKey) {
      console.error('[auth/private-key] Private key and certificate do not form a matching pair', {
        secretId,
        hasPrivateKeyPublicKey: Boolean(privateKeyPublicKey),
        hasCertificatePublicKey: Boolean(certificatePublicKey),
        privateKeySpkiSha256,
        certificateSpkiSha256,
      });
      return null;
    }
  }

  const material = { pem, x5tS256 };
  privateKeyCache.set(secretId, { value: material, fetchedAt: now });
  return material;
}
