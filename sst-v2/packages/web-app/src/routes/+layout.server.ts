import type { LayoutServerLoad } from './$types';
import { Config } from 'sst/node/config';
import enFooterLinks from '$lib/components/footer/i18n/en/links.json';
import enLegal from '$lib/components/footer/i18n/en/legal.json';
import frFooterLinks from '$lib/components/footer/i18n/fr/links.json';
import frLegal from '$lib/components/footer/i18n/fr/legal.json';
import enNavitems from '$lib/components/header/i18n/en/navitems.json';
import frNavitems from '$lib/components/header/i18n/fr/navitems.json';
import enHeaderTranslations from '$lib/components/header/i18n/en/translations.json';
import frHeaderTranslations from '$lib/components/header/i18n/fr/translations.json';
import enShareTranslations from '$lib/components/share/i18n/en/translations.json';
import frShareTranslations from '$lib/components/share/i18n/fr/translations.json';

export const load: LayoutServerLoad = async ({ cookies, params }) => {
	return {
		lang: params.lang,
		FEATURE_SIGN_IN: Config.FEATURE_SIGN_IN === 'true' ? true : false,
		signedIn: cookies.get('id_token') ? true : false,
		footerLinks: params.lang == 'fr-ca' ? frFooterLinks : enFooterLinks,
		legalData: params.lang == 'fr-ca' ? frLegal : enLegal,
		navitems: params.lang == 'fr-ca' ? frNavitems : enNavitems,
		headerTranslations: params.lang == 'fr-ca' ? frHeaderTranslations : enHeaderTranslations,
		shareTranslations: params.lang == 'fr-ca' ? frShareTranslations : enShareTranslations,
	};
};
