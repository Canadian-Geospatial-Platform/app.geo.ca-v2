import type { TokenPayload } from '$lib/db/db-types';
import { randomUUID } from 'node:crypto';
import { decodeBase64UrlJson } from '$lib/utils/auth/base64url';
import { splitJwt } from '$lib/utils/auth/jwt';
import { verifyJwtSignatureWithJwks } from '$lib/utils/auth/jwt-signature.server';
import { getAudienceValues, hasNumericIat, hasValidExp, hasValidNbf, issuerMatches } from '$lib/utils/auth/oidc-claims.server';
import { ensureTrailingSlashless, getOidcPublicConfig, getOpenIdConfiguration, isHttpsOrLocalhostUrl } from '$lib/utils/auth/oidc.server';
import { getRequestedScopes, validateScopedIdTokenClaims } from '$lib/utils/auth/scope-policy.server';
import type { JwtHeader } from '$lib/utils/auth/jwt-types';

/**
 * Verifies the ID token signature and required OIDC claims against provider metadata.
 *
 * @param idToken - Raw ID token JWT.
 * @param expectedNonce - Optional nonce expected from the authorize request.
 * @returns Verified token payload when valid; otherwise null.
 */
export async function verifyIdToken(idToken: string, expectedNonce?: string | null): Promise<TokenPayload | null> {
  const telemetryBase = {
    correlationId: randomUUID(),
    component: 'id_token_verification',
  };

  const getEndpointCategory = (reason: string): 'discovery' | 'jwks' | 'id_token_verification' => {
    if (reason === 'discovery_failed') {
      return 'discovery';
    }

    if (reason === 'jwks_fetch_failed' || reason === 'jwk_not_found' || reason === 'signature_invalid') {
      return 'jwks';
    }

    return 'id_token_verification';
  };

  const fail = (reason: string, details?: Record<string, unknown>): null => {
    console.error('[auth/id-token] verification_failed', {
      ...telemetryBase,
      endpointCategory: getEndpointCategory(reason),
      reason,
      ...(details ?? {}),
    });
    return null;
  };

  const parts = splitJwt(idToken);
  if (!parts) {
    return fail('malformed_jwt');
  }

  const header = decodeBase64UrlJson<JwtHeader>(parts.header);
  const payload = decodeBase64UrlJson<TokenPayload>(parts.payload);
  if (!header || !payload) {
    return fail('decode_failed');
  }

  const oidcConfig = getOidcPublicConfig();
  if (!oidcConfig) {
    return fail('missing_oidc_config');
  }
  const { clientId, customDomain } = oidcConfig;

  if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
    return fail('unsupported_header', {
      alg: header.alg,
      hasKid: typeof header.kid === 'string',
    });
  }

  const openIdConfiguration = await getOpenIdConfiguration(customDomain);
  const normalizedIssuer = openIdConfiguration?.issuer ? ensureTrailingSlashless(openIdConfiguration.issuer) : null;
  const configuredJwksUri = openIdConfiguration?.jwks_uri ?? null;
  const discoveryFailureDetails = {
    hasIssuer: Boolean(openIdConfiguration?.issuer),
    hasJwksUri: Boolean(openIdConfiguration?.jwks_uri),
    customDomain,
  };

  if (!normalizedIssuer || !configuredJwksUri || !isHttpsOrLocalhostUrl(normalizedIssuer) || !isHttpsOrLocalhostUrl(configuredJwksUri)) {
    return fail('discovery_failed', discoveryFailureDetails);
  }
  const jwksCandidates = [configuredJwksUri];

  if (!issuerMatches(payload.iss, normalizedIssuer)) {
    return fail('issuer_mismatch', {
      tokenIss: payload.iss,
      expectedIss: normalizedIssuer,
    });
  }

  const audience = getAudienceValues(payload.aud);
  if (!audience.includes(clientId)) {
    return fail('audience_mismatch', {
      audience,
      clientId,
    });
  }

  if (!hasValidExp(payload.exp)) {
    return fail('expired_or_missing_exp', {
      exp: payload.exp,
    });
  }

  if (!hasValidNbf(payload.nbf)) {
    return fail('nbf_in_future', {
      nbf: payload.nbf,
    });
  }

  if (!hasNumericIat(payload.iat) || (!payload.sub && !payload.username)) {
    return fail('missing_required_claims', {
      hasIat: hasNumericIat(payload.iat),
      hasSub: Boolean(payload.sub),
      hasUsername: Boolean(payload.username),
      iat: payload.iat,
    });
  }

  const requestedScopes = getRequestedScopes();
  const scopeClaimValidation = validateScopedIdTokenClaims(payload, requestedScopes);
  if (!scopeClaimValidation.ok) {
    return fail('scope_claim_policy_failed', {
      requestedScopes,
      scope: scopeClaimValidation.scope,
      invalidClaim: scopeClaimValidation.invalidClaim,
      expectedType: scopeClaimValidation.expectedType,
      actualType: scopeClaimValidation.actualType,
    });
  }

  // Strict nonce mode: expected nonce must round-trip in the ID token and match exactly.
  if (expectedNonce && (typeof payload.nonce !== 'string' || payload.nonce !== expectedNonce)) {
    return fail('nonce_mismatch', {
      hasExpectedNonce: true,
      hasTokenNonce: typeof payload.nonce === 'string',
    });
  }

  const failFromSignatureResult = (result: Exclude<Awaited<ReturnType<typeof verifyJwtSignatureWithJwks>>, { ok: true }>): null => {
    if (result.reason === 'jwks_fetch_failed') {
      return fail('jwks_fetch_failed', {
        status: result.status,
        candidatesTried: jwksCandidates,
      });
    }

    if (result.reason === 'jwk_not_found') {
      return fail('jwk_not_found', {
        kid: header.kid,
        keyCount: result.keyCount,
      });
    }

    if (result.reason === 'signature_invalid') {
      return fail('signature_invalid');
    }

    return fail('verification_exception', {
      error: result.error,
    });
  };

  const signatureResult = await verifyJwtSignatureWithJwks(header, parts, jwksCandidates);
  if (!signatureResult.ok) {
    return failFromSignatureResult(signatureResult);
  }

  return payload;
}
