import type { PageLoad } from './$types';
import enLabels from '$lib/components/favourites/i18n/en/translations.json';
import frLabels from '$lib/components/favourites/i18n/fr/translations.json';

/**
 * Loads localized labels and forwards server data for the maps tab.
 *
 * Merges route language labels with server-provided metadata and user data.
 *
 * @param params - Route parameters containing language.
 * @param data - Server-loaded page data.
 * @returns Localized page data for the maps route.
 */
export const load: PageLoad = ({ params, data }) => {
  const lang = params.lang as 'fr-ca' | 'en-ca';
  const t = lang === 'fr-ca' ? frLabels : enLabels;

  return {
    lang,
    t,
    tTitle1: data.tTitle1,
    tTitle2: data.tTitle2,
    tTitle3: data.tTitle3,
    results: data.results,
    userData: data.userData,
    canonicalUrl: data.canonicalUrl,
    alternateUrl: data.alternateUrl,
    alternateLang: data.alternateLang,
    metaDescription: data.metaDescription,
  };
};
