import type { PageLoad } from './$types';
import enLabels from '$lib/components/favourites/i18n/en/translations.json';
import frLabels from '$lib/components/favourites/i18n/fr/translations.json';

export const load: PageLoad = ({ params, data }) => {
  const lang = params.lang as 'fr-ca' | 'en-ca';
  const t = lang === 'fr-ca' ? frLabels : enLabels;

  return {
    lang: lang,
    t: t,
    tTitle1: data.tTitle1,
    tTitle2: data.tTitle2,
    results: data.results,
    userData: data.userData,
    canonicalUrl: data.canonicalUrl,
    alternateUrl: data.alternateUrl,
    alternateLang: data.alternateLang,
    metaDescription: data.metaDescription,
  };
};
