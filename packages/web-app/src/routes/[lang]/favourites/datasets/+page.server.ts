import { getTranslations } from '#lib/i18n/index.js';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAppLanguage } from '#lib/utils/language.js';
import { loadFavouritesPageData } from '#lib/utils/favourites/page-load.server.js';
import { buildPageTitle } from '#lib/utils/metadata.js';

/**
 * Loads favourites datasets page data for signed-in users.
 *
 * @param event - SvelteKit page-server load event.
 * @returns Localized datasets page data and metadata.
 */
export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
  const appLang = getAppLanguage(params.lang);
  const pageData = await loadFavouritesPageData({ fetch, url, cookies, lang: appLang });

  if (!pageData.userData.uuid) {
    throw redirect(303, `/${appLang}/favourites`);
  }

  const favouritesUrl = new URL(`/${appLang}/favourites`, url.origin);

  return {
    lang: appLang,
    ...pageData,
    tTitle2: { ...pageData.tTitle2, href: favouritesUrl.href },
    tTitle3: buildPageTitle(url, getTranslations(appLang).components.favourites.labels.datasetsTab),
  };
};
