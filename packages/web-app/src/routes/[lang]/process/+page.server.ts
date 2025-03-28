import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import enLabels from '$lib/components/processes/i18n/en/translations.json';
import frLabels from '$lib/components/processes/i18n/fr/translations.json';

export const load: PageLoad = async (params) => {
    // let serviceUrl = "https://d6g0331e16.execute-api.ca-central-1.amazonaws.com/Stage/processes/FloodMapping";
    // let serviceUrl = "https://d6g0331e16.execute-api.ca-central-1.amazonaws.com/Prod/processes/FloodMapping";
		let serviceUrl = "https://6xpbbg5m41.execute-api.ca-central-1.amazonaws.com/Prod/processes/FloodMapping?lang=en";
    const svcDef = await fetch(serviceUrl)
    if (!svcDef.ok) {
        throw new Error('Bad response');
    }

    let svcDefJson;
	try {
        svcDefJson = await svcDef.json();
    } catch (e) {
        console.warn(e);
    }

	let t = params.params.lang == 'fr-ca' ? frLabels : enLabels;

    return {
        "svcDef": svcDefJson,
        "t": t
    }
};
