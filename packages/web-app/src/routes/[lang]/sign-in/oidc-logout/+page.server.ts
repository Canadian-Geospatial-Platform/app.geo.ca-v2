import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOidcLogoutUrl } from '$lib/utils/auth/sign-in-core.server';

/**
 * Redirects to the provider logout endpoint when available,
 * otherwise falls back to local sign-out.
 *
 * In local development (`localhost`/`127.0.0.1`), provider logout is skipped
 * to avoid back-channel logout failures against non-public callback URLs.
 *
 * @param event - SvelteKit load event containing URL and language params.
 * @returns Redirect response to provider logout URL or local logout path.
 */
export const load: PageServerLoad = async ({ url, params }: Parameters<PageServerLoad>[0]): Promise<void> => {
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const returnTo = url.searchParams.get('returnTo');
  const localLogoutPath = returnTo
    ? `/${params.lang}/sign-in/logout?returnTo=${encodeURIComponent(returnTo)}`
    : `/${params.lang}/sign-in/logout`;

  if (isLocalhost) {
    throw redirect(303, localLogoutPath);
  }

  const oidcLogoutUrl = await getOidcLogoutUrl(url);
  if (!oidcLogoutUrl) {
    throw redirect(303, localLogoutPath);
  }

  throw redirect(303, oidcLogoutUrl);
};
