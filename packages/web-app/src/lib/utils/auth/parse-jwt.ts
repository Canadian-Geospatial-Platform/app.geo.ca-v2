import type { Cookies } from '@sveltejs/kit';
import type { TokenPayload, TokenResponse } from '$lib/db/db-types';
import { verifyIdToken } from '$lib/utils/auth/id-token.server';
import { clearAuthCookies } from '$lib/utils/auth/auth-cookies';

/**
 * Parses id_token from cookies and verifies it against provider JWKS metadata.
 *
 * Cleans up orphaned or stale auth cookies (e.g. a refresh_token that outlived
 * the id_token, or an id_token that fails verification) so the client is returned
 * to a consistent anonymous state instead of a partial auth state.
 *
 * @param cookies - The cookies object containing user session data.
 * @returns A token response containing an ok flag and verified claims when available.
 */
export async function getToken(cookies: Cookies): Promise<TokenResponse> {
  const token = cookies.get('id_token');
  if (!token) {
    // id_token is gone (expired or cleared) but a stale refresh_token may remain.
    // Clear all auth cookies to avoid partial/confusing auth state.
    if (cookies.get('refresh_token') || cookies.get('access_token')) {
      clearAuthCookies(cookies);
      return { ok: false, staleCleared: true };
    }
    return { ok: false };
  }

  const value: TokenPayload | null = await verifyIdToken(token);
  if (!value?.sub && !value?.username) {
    // id_token present but invalid or expired (e.g. clock skew, tampered token).
    // Clear all auth cookies so the client is in a clean anonymous state.
    clearAuthCookies(cookies);
    return { ok: false, staleCleared: true };
  }

  return {
    ok: true,
    value,
  };
}
