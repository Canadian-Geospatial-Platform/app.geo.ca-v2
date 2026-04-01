import type { Cookies } from '@sveltejs/kit';

/**
 * Checks whether a token exists in cookies.
 *
 * @param cookies - The cookies object containing user session data.
 * @returns A promise that resolves to an object indicating whether a token was found.
 */
export async function getToken(cookies: Cookies): Promise<{ ok: boolean }> {
  const token = cookies.get('token');
  return { ok: Boolean(token) };
}
