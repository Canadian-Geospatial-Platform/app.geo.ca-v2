import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getAppLanguage } from '$lib/utils/language';
import { loadFavouritesPageData } from '$lib/utils/favourites/page-load.server';
import { buildPageTitle } from '$lib/utils/metadata';

/**
 * Loads favourites map view page data for signed-in users.
 *
 * @param event - SvelteKit page-server load event.
 * @returns Localized map-view page data and metadata.
 */
export const load: PageServerLoad = async ({ fetch, params, url, cookies }) => {
  const lang = getAppLanguage(params.lang);
  const pageData = await loadFavouritesPageData({ fetch, url, cookies, lang });
  const ids = (url.searchParams.get('ids') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  const hasDatasetIds = ids.length > 0;

  if (!pageData.userData.uuid && !hasDatasetIds) {
    throw redirect(303, `/${lang}/favourites`);
  }

  const favouritesUrl = new URL(`/${lang}/favourites`, url.origin);

  return {
    lang,
    ...pageData,
    tTitle2: buildPageTitle(favouritesUrl, lang, 'Favourites', 'Favoris'),
    tTitle3: buildPageTitle(url, lang, 'Map', 'Carte'),
  };
};
