import type { Cookies } from '@sveltejs/kit';
import { clearSessionCookie } from '$lib/utils/auth/session-cookie.server';

/**
 * Clears all authentication cookies.
 *
 * @param cookies - Cookie jar from the request context.
 */
export function clearAuthCookies(cookies: Cookies): void {
  clearSessionCookie(cookies);
  cookies.delete('access_token', { path: '/' });
  cookies.delete('id_token', { path: '/' });
  cookies.delete('refresh_token', { path: '/' });
  cookies.delete('pkce_verifier', { path: '/' });
  cookies.delete('oidc_nonce', { path: '/' });
  cookies.delete('oidc_state', { path: '/' });
  cookies.delete('oidc_return_to', { path: '/' });
  cookies.delete('auth_error', { path: '/' });
  cookies.delete('post_logout_lang', { path: '/' });
}
