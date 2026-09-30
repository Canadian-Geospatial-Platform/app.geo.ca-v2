import type { PageLoad } from './$types';

import enLabels from '$lib/geochat/i18n/en/translations.json';
import frLabels from '$lib/geochat/i18n/fr/translations.json';

export const load: PageLoad = ({ params, data }) => {
  const lang = params.lang as 'en-ca' | 'fr-ca';

  const t = lang === 'fr-ca' ? frLabels : enLabels;

  return {
    ...data,
    lang,
    t,
  };
};
