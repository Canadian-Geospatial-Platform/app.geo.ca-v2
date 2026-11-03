import type { PageServerLoad } from './$types';
import { getAppLanguage } from '#lib/utils/language.js';

/**
 * Resolves a same-app return state and the localized sign-in route.
 *
 * @param event - SvelteKit load event containing URL and language params.
 * @returns Browser destination for starting OIDC sign-in.
 */
export const load: PageServerLoad = ({ params, url }) => {
  const lang = getAppLanguage(params.lang);
  const fallbackState = new URL(`/${lang}/favourites`, url.origin).href;
  const requestedState = url.searchParams.get('state');
  let state = fallbackState;

  if (requestedState) {
    try {
      const candidate = new URL(requestedState, url.origin);
      if (candidate.origin === url.origin && candidate.pathname.startsWith(`/${lang}/`)) {
        state = candidate.href;
      }
    } catch {
      state = fallbackState;
    }
  }

  return {
    lang,
    signInUrl: `/${lang}/sign-in/send?state=${encodeURIComponent(state)}`,
  };
};
