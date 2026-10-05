import { createPublicKey, createVerify, randomUUID } from 'node:crypto';
import { decodeBase64UrlBytes } from '$lib/utils/auth/base64url';
import type { JwtHeader, JsonWebKey } from '$lib/utils/auth/jwt-types';
import type { JwtParts } from '$lib/utils/auth/jwt';

/**
 * Result shape returned by JWT signature verification attempts.
 */
export type JwtSignatureVerificationResult =
  | { ok: true }
  | { ok: false; reason: 'jwks_fetch_failed'; status: number | null }
  | { ok: false; reason: 'jwk_not_found'; keyCount: number }
  | { ok: false; reason: 'signature_invalid' }
  | { ok: false; reason: 'verification_exception'; error: string };

/**
 * Verifies a JWT RSA signature using one or more JWKS endpoints.
 *
 * @param header - Decoded JWT header containing key id and algorithm.
 * @param parts - Split JWT parts including signing input and signature.
 * @param jwksCandidates - Ordered list of JWKS URLs to attempt.
 * @returns Structured verification result with failure reason details.
 */
export async function verifyJwtSignatureWithJwks(
  header: JwtHeader,
  parts: JwtParts,
  jwksCandidates: string[]
): Promise<JwtSignatureVerificationResult> {
  const telemetry = {
    correlationId: randomUUID(),
    endpointCategory: 'jwks',
    candidateCount: jwksCandidates.length,
    keyId: header.kid,
  };

  try {
    let jwks: { keys?: JsonWebKey[] } | null = null;
    let lastStatus: number | null = null;
    const attempts: Array<{ uri: string; status: number | null; error?: string }> = [];

    for (const jwksUri of jwksCandidates) {
      try {
        const jwksResponse = await fetch(jwksUri);
        attempts.push({ uri: jwksUri, status: jwksResponse.status });
        if (!jwksResponse.ok) {
          lastStatus = jwksResponse.status;
          continue;
        }

        jwks = (await jwksResponse.json()) as { keys?: JsonWebKey[] };
        if (Array.isArray(jwks.keys)) {
          break;
        }
      } catch (error) {
        attempts.push({
          uri: jwksUri,
          status: null,
          error: error instanceof Error ? error.message : 'unknown_error',
        });
      }
    }

    if (!jwks) {
      console.error('[auth/jwks] jwks_fetch_failed', {
        ...telemetry,
        status: lastStatus,
        attempts,
      });
      return {
        ok: false,
        reason: 'jwks_fetch_failed',
        status: lastStatus,
      };
    }

    const jwk = header.kid
      ? jwks.keys?.find((key) => key.kid === header.kid && key.kty === 'RSA' && key.use !== 'enc')
      : jwks.keys?.find((key) => key.kty === 'RSA' && key.use !== 'enc');
    if (!jwk) {
      console.error('[auth/jwks] signing_key_not_found', {
        ...telemetry,
        keyCount: jwks.keys?.length ?? 0,
      });
      return {
        ok: false,
        reason: 'jwk_not_found',
        keyCount: jwks.keys?.length ?? 0,
      };
    }

    const publicKey = createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' });
    const verifier = createVerify('RSA-SHA256');
    verifier.update(parts.signingInput);
    verifier.end();

    if (!verifier.verify(publicKey, decodeBase64UrlBytes(parts.signature))) {
      console.error('[auth/jwks] signature_invalid', telemetry);
      return {
        ok: false,
        reason: 'signature_invalid',
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('[auth/jwks] verification_exception', {
      ...telemetry,
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    return {
      ok: false,
      reason: 'verification_exception',
      error: error instanceof Error ? error.message : 'unknown_error',
    };
  }
}
