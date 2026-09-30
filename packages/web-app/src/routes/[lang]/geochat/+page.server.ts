import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
  const lang = params.lang;

  const alternateLang = lang === 'fr-ca' ? 'en-ca' : 'fr-ca';
  const alternateLanguageUrl = url.href.replace(lang, alternateLang);

  return {
    lang,
    alternateLang,
    alternateLanguageUrl,
  };
};
