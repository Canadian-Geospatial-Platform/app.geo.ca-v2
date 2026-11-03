import type { Actions, PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOidcLogoutUrl } from '#lib/utils/auth/sign-in-core.server.js';
import { getCookieDomainOptions, isSecureCookieEnvironment } from '#lib/utils/auth/cookie-policy.server.js';
import { isLocalhostUrl } from '#lib/utils/auth/oidc.server.js';
import { getAppLanguage } from '#lib/utils/language.js';

/**
 * Renders the confirmation page without changing the user's authentication state.
 *
 * @param event - SvelteKit load event containing URL and language params.
 * @returns Confirmation data and a safe local return path.
 */
export const load: PageServerLoad = ({ url, params }) => {
  const lang = getAppLanguage(params.lang);
  return {
    lang,
    returnTo: url.searchParams.get('returnTo') === `/${lang}/favourites` ? `/${lang}/favourites` : null,
  };
};

/**
 * Defines the logout form actions; the confirm action begins logout only after user consent.
 */
export const actions: Actions = {
  confirm: async ({ cookies, params, request, url }) => {
    const formData = await request.formData();
    const requestedReturnTo = formData.get('returnTo');
    const returnTo = requestedReturnTo === `/${params.lang}/favourites` ? requestedReturnTo : null;
    const localLogoutPath = returnTo
      ? `/${params.lang}/sign-in/logout?returnTo=${encodeURIComponent(returnTo)}`
      : `/${params.lang}/sign-in/logout`;

    // Set the callback locale only after the user confirms logout.
    cookies.set('post_logout_lang', params.lang, {
      path: '/',
      ...getCookieDomainOptions(),
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureCookieEnvironment(),
      maxAge: 600,
    });

    if (isLocalhostUrl(url.href)) {
      throw redirect(303, localLogoutPath);
    }

    const oidcLogoutUrl = await getOidcLogoutUrl(url, cookies);
    if (!oidcLogoutUrl) {
      throw redirect(303, localLogoutPath);
    }

    throw redirect(303, oidcLogoutUrl, { external: true });
  },
};
