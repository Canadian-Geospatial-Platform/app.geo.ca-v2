import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAppLanguage } from '#lib/utils/language.js';
import { loadFavouritesPageData } from '#lib/utils/favourites/page-load.server.js';
import { buildPageTitle } from '#lib/utils/metadata.js';

/**
 * Loads favourites maps page data for signed-in users.
 *
 * @param event - SvelteKit page-server load event.
 * @returns Localized maps page data and metadata.
 */
export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
  const lang = getAppLanguage(params.lang);
  const pageData = await loadFavouritesPageData({ fetch, url, cookies, lang });

  if (!pageData.userData.uuid) {
    throw redirect(303, `/${lang}/favourites`);
  }

  const favouritesUrl = new URL(`/${lang}/favourites`, url.origin);

  return {
    lang,
    ...pageData,
    tTitle2: { ...pageData.tTitle2, href: favouritesUrl.href },
    tTitle3: buildPageTitle(url, lang, 'Maps', 'Cartes'),
  };
};
