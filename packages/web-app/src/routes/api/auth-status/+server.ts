import type { RequestHandler } from './$types';
import * as env from '$app/env/private';
import { getUserData } from '#lib/db/user.js';

/** Exact origins permitted to make credentialed auth-status requests. */
const allowedOrigins = (env.AUTH_STATUS_ALLOWED_ORIGINS ?? process.env.AUTH_STATUS_ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/**
 * Checks whether a request origin is configured for credentialed access.
 *
 * @param origin - Origin header from the request, or null when absent.
 * @returns True when the origin exactly matches a configured allowed origin.
 */
function isAllowedOrigin(origin: string | null): origin is string {
  return origin !== null && allowedOrigins.includes(origin);
}

/**
 * Builds non-cacheable response headers, adding credentialed CORS headers for allowed origins.
 *
 * @param origin - Origin header from the request, or null when absent.
 * @returns Headers for an auth-status response.
 */
function createResponseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  });

  if (isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  return headers;
}

/**
 * Returns whether the request has a valid authenticated session.
 *
 * The static geo.ca site can call this endpoint with credentials included;
 * authentication cookies remain HTTP-only and are validated on the server.
 *
 * @param event - SvelteKit request event.
 * @param event.cookies - Request cookies containing the authentication session.
 * @param event.request - Incoming request, used to read the Origin header.
 * @returns JSON `{ signedIn }`, 403 for disallowed origins, or 503 when status cannot be verified.
 */
export const GET: RequestHandler = async ({ cookies, request }): Promise<Response> => {
  const origin = request.headers.get('origin');
  const headers = createResponseHeaders(origin);

  if (origin && !isAllowedOrigin(origin)) {
    return Response.json({ signedIn: false }, { status: 403, headers });
  }

  const userInfo = await getUserData(cookies);
  if (userInfo.status === 'unavailable') {
    return Response.json({ error: 'Authentication status unavailable' }, { status: 503, headers });
  }

  return Response.json({ signedIn: Boolean(userInfo.Item.uuid) }, { headers });
};

/**
 * Handles credentialed cross-origin preflight requests from configured static-site origins.
 *
 * @param event - SvelteKit request event.
 * @param event.request - Incoming preflight request, used to read the Origin header.
 * @returns Empty 204 response for allowed origins, otherwise 403.
 */
export const OPTIONS: RequestHandler = async ({ request }): Promise<Response> => {
  const origin = request.headers.get('origin');
  const headers = createResponseHeaders(origin);

  if (!isAllowedOrigin(origin)) {
    return new Response(null, { status: 403, headers });
  }

  return new Response(null, { status: 204, headers });
};
