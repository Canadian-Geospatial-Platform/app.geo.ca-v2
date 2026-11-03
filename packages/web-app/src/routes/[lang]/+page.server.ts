import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAppLanguage } from '#lib/utils/language.js';

/**
 * Redirects the localized root page to the corresponding map-browser route.
 *
 * @param params - Route parameters containing the requested language.
 * @throws Redirects to the normalized localized map-browser route.
 */
export const load: PageServerLoad = ({ params }) => {
  throw redirect(307, `/${getAppLanguage(params.lang)}/map-browser`);
};
