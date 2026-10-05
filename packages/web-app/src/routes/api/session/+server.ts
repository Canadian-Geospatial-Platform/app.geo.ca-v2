import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getToken } from '$lib/utils/auth/parse-jwt';
import { getPrivateKeyMaterial } from '$lib/utils/auth/oidc.server';
import { exchangeRefreshToken, setAuthCookies } from '$lib/utils/auth/sign-in-core.server';
import { verifyIdToken } from '$lib/utils/auth/id-token.server';
import { touchSessionCookie } from '$lib/utils/auth/session-cookie.server';

/**
 * Returns the verified ID-token expiry for the current session.
 *
 * @param cookies - Request cookies containing the authenticated session.
 * @returns Session expiry in milliseconds, or 401 when unauthenticated.
 */
export const GET: RequestHandler = async ({ cookies }): Promise<Response> => {
  const token = await getToken(cookies);
  if (
    !token.ok ||
    typeof token.value?.exp !== 'number' ||
    (typeof token.value.sub !== 'string' && typeof token.value.username !== 'string') ||
    !touchSessionCookie(
      cookies,
      token.value.sub ?? token.value.username ?? '',
      typeof token.value.sid === 'string' ? token.value.sid : null
    )
  ) {
    return json({ signedIn: false }, { status: 401 });
  }

  return json({ signedIn: true, expiresAt: token.value.exp * 1000 });
};

/**
 * Refreshes the authenticated session using the HTTP-only refresh token.
 *
 * @param cookies - Request cookies containing the authenticated session.
 * @returns New expiry or 401 when refresh is unavailable or rejected.
 */
export const POST: RequestHandler = async ({ cookies }): Promise<Response> => {
  const refreshToken = cookies.get('refresh_token');
  if (!refreshToken) {
    return json({ signedIn: false }, { status: 401 });
  }

  const keyMaterial = await getPrivateKeyMaterial();
  const tokenResponse = await exchangeRefreshToken(refreshToken, keyMaterial?.pem ?? null, keyMaterial?.x5tS256 ?? null);
  const verifiedIdToken = tokenResponse?.id_token ? await verifyIdToken(tokenResponse.id_token) : null;
  // A failed refresh makes the local session untrustworthy; the client must enter logout recovery.
  if (
    !tokenResponse?.id_token ||
    !tokenResponse.access_token ||
    !verifiedIdToken ||
    !touchSessionCookie(
      cookies,
      verifiedIdToken.sub ?? verifiedIdToken.username ?? '',
      typeof verifiedIdToken.sid === 'string' ? verifiedIdToken.sid : null
    ) ||
    !setAuthCookies(cookies, tokenResponse)
  ) {
    return json({ signedIn: false }, { status: 401 });
  }

  const token = await getToken(cookies);
  if (!token.ok || typeof token.value?.exp !== 'number') {
    return json({ signedIn: false }, { status: 401 });
  }

  return json({ signedIn: true, expiresAt: token.value.exp * 1000 });
};
