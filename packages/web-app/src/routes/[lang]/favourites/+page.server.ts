import type { Actions, PageServerLoad } from './$types';
import { clearFavourites, removeFromFavourites } from '$lib/actions';
import { getAppLanguage } from '$lib/utils/language';
import { loadFavouritesPageData } from '$lib/utils/favourites/page-load.server';

/**
 * Loads the favourites page data by reading user favourites, fetching matching
 * GeoCore records, and preparing localized SEO metadata.
 *
 * @param event - SvelteKit page-server load event.
 * @returns Localized favourites page data and metadata.
 */
export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
  const lang = getAppLanguage(params.lang);
  const pageData = await loadFavouritesPageData({ fetch, url, cookies, lang });

  return {
    lang,
    ...pageData,
  };
};

/**
 * Server actions for mutating favourites from the favourites page UI.
 */
export const actions = {
  removeFromFavourites: removeFromFavourites,
  clearFavourites: clearFavourites,
} satisfies Actions;
