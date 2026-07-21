import { decodeBase64UrlJson } from '$lib/utils/auth/base64url';
import { splitJwt } from '$lib/utils/auth/jwt';
import { verifyJwtSignatureWithJwks } from '$lib/utils/auth/jwt-signature.server';
import { getAudienceValues, hasNumericIat, hasValidExp, issuerMatches } from '$lib/utils/auth/oidc-claims.server';
import { ensureTrailingSlashless, getOidcConfig, getOpenIdConfiguration } from '$lib/utils/auth/oidc.server';
import type { JwtHeader } from '$lib/utils/auth/jwt-types';

const BACK_CHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout';

/**
 * Back-channel logout token claims used by logout notification verification.
 */
export type BackChannelLogoutTokenPayload = {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  jti?: string;
  sid?: string;
  events?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Verifies a back-channel logout token from the provider.
 *
 * @param logoutToken - JWT logout token from the provider.
 * @returns The validated payload when verification succeeds; otherwise null.
 */
export async function verifyBackChannelLogoutToken(logoutToken: string): Promise<BackChannelLogoutTokenPayload | null> {
  const parts = splitJwt(logoutToken);
  if (!parts) {
    return null;
  }

  const header = decodeBase64UrlJson<JwtHeader>(parts.header);
  const payload = decodeBase64UrlJson<BackChannelLogoutTokenPayload>(parts.payload);
  if (!header || !payload) {
    return null;
  }

  const { clientId, customDomain } = getOidcConfig();
  if (!clientId || !customDomain) {
    return null;
  }

  if (header.alg !== 'RS256') {
    return null;
  }

  const openIdConfiguration = await getOpenIdConfiguration(customDomain);
  if (!openIdConfiguration?.issuer || !openIdConfiguration.jwks_uri) {
    return null;
  }

  const normalizedIssuer = ensureTrailingSlashless(openIdConfiguration.issuer);
  if (!issuerMatches(payload.iss, normalizedIssuer)) {
    return null;
  }

  const audience = getAudienceValues(payload.aud);
  if (!audience.includes(clientId)) {
    return null;
  }

  if (!hasValidExp(payload.exp)) {
    return null;
  }

  if (
    !hasNumericIat(payload.iat) ||
    typeof payload.jti !== 'string' ||
    payload.jti.length === 0 ||
    !payload.events ||
    !(BACK_CHANNEL_LOGOUT_EVENT in payload.events)
  ) {
    return null;
  }

  const signatureResult = await verifyJwtSignatureWithJwks(header, parts, [openIdConfiguration.jwks_uri]);
  if (!signatureResult.ok) {
    return null;
  }

  return payload;
}
