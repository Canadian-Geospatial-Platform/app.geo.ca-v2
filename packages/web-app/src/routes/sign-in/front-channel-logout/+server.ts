import type { RequestHandler } from './$types';
import { clearAuthCookies } from '$lib/utils/auth/auth-cookies';

/**
 * Handles front-channel logout callbacks from the OP.
 *
 * This endpoint accepts optional `sid` or `logout` query parameters and
 * clears local auth cookies to invalidate the RP session.
 */
export const GET: RequestHandler = async ({ cookies }) => {
  clearAuthCookies(cookies);
  return new Response(null, { status: 204 });
};
