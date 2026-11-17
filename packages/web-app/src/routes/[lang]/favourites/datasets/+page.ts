import { getAppLanguage } from '#lib/utils/language.js';
import type { PageLoad } from './$types';

/**
 * Normalizes the language and forwards server data for the datasets tab.
 *
 * @param params - Route parameters containing language.
 * @param data - Server-loaded page data.
 * @returns Localized page data for the datasets route.
 */
export const load: PageLoad = ({ params, data }) => {
  const appLang = getAppLanguage(params.lang);

  return {
    lang: appLang,
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
