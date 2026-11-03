import type { Cookies } from '@sveltejs/kit';
import { getCookieDomainOptions } from '#lib/utils/auth/cookie-policy.server.js';
import { clearSessionCookie } from '#lib/utils/auth/session-cookie.server.js';

/**
 * Clears all authentication cookies.
 *
 * @param cookies - Cookie jar from the request context.
 */
export function clearAuthCookies(cookies: Cookies): void {
  clearSessionCookie(cookies);
  cookies.delete('access_token', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('id_token', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('refresh_token', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('pkce_verifier', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('oidc_nonce', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('oidc_state', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('oidc_return_to', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('auth_error', { path: '/', ...getCookieDomainOptions() });
  cookies.delete('post_logout_lang', { path: '/', ...getCookieDomainOptions() });
}
