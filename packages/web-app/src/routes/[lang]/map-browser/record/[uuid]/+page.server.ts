import type { PageServerLoad } from './$types';
import enLabels from '$lib/components/record/i18n/en/translations.json';
import frLabels from '$lib/components/record/i18n/fr/translations.json';
import { error } from '@sveltejs/kit';
import { parseText } from '$lib/utils/parse-text.ts';
import { formatNumber } from '$lib/utils/format-number.ts';

export const load: PageServerLoad = async ({ request, fetch, params, url, cookies }) => {
	// The "sst/node/config" package dynamically binds resources at runtime.
	// Importing it at the top level would cause build-time errors because SST resources
	// are not available during the build process. To avoid this, we import it inside
	// the `load()` function so it's only accessed when the server is running.
	const config = await import('sst/node/config');
	const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

	const lang = params.lang === 'en-ca' ? 'en' : 'fr';

	let record;
	let response = await generateUrl(
		fetch,
		params.uuid,
		lang,
		cookies.get('id_token'),
		request.headers.get('x-forwarded-for')
	);
	try {
		record = await response.json();
	} catch (e) {
		console.error(e);
	}

	// @ts-ignore
	const fetchSimilar = async (id) => {
		try {
			const collectionsResponse = await fetch(`${GEOCORE_API_DOMAIN}/id/v2?id=${id}&lang=${lang}`);
			const parsedCollectionsResponse = await collectionsResponse.json();
			const similar = parsedCollectionsResponse?.body?.Items?.[0]?.similarity ?? [];
			return similar;
		} catch (e) {
			console.error('Error fetching similar items:', e);
			return []; // Return empty array if fetch fails
		}
	};

	const fetchRelated = async (id) => {
		try {
			const collectionsResponse = await fetch(`${GEOCORE_API_DOMAIN}/collections?id=${id}`);
			const parsedCollectionsResponse = await collectionsResponse.json();
			const related = [];

			if (parsedCollectionsResponse.parent) {
				related.push({ ...parsedCollectionsResponse.parent, ...{ type: 'parent' } });
			}
			if (parsedCollectionsResponse.sibling_count > 0) {
				parsedCollectionsResponse.sibling.forEach((s) => {
					related.push({ ...s, ...{ type: 'member' } });
				});
			}
			if (parsedCollectionsResponse.child_count > 0) {
				parsedCollectionsResponse.child.forEach((s) => {
					related.push({ ...s, ...{ type: 'member' } });
				});
			}

			return related;
		} catch (e) {
			console.error('Error fetching related items:', e);
			return []; // Return empty array if fetch fails
		}
	};

	const fetchAnalytics = async (id, lang) => {
		let parsedAnalyticResponse;
		try {
			const analyticResponse = await fetch(
				`${GEOCORE_API_DOMAIN}/analytics/10?uuid=${id}&lang=${lang}`
			);
			parsedAnalyticResponse = JSON.parse(await analyticResponse.json());
		} catch (e) {
			console.error(
				'error fetching analytics from:',
				`${GEOCORE_API_DOMAIN}/analytics/10?uuid=${id}&lang=${lang}\nerror message:`,
				e
			);
		}
		return parsedAnalyticResponse;
	};

	let t = params.lang == 'en-ca' ? enLabels : frLabels;

	const analyticRes = await fetchAnalytics(params.uuid, lang);

	if (analyticRes['30']) {
		analyticRes['30'] = formatNumber(analyticRes['30']);
	}

	if (analyticRes.all) {
		analyticRes.all = formatNumber(analyticRes.all);
	}

	const similar = await fetchSimilar(params.uuid);
	const related = await fetchRelated(params.uuid);

	let item_v2 = record.body.Items[0];

	if (item_v2?.keywords) {
		item_v2.keywords = item_v2.keywords.split(',');
	}

	if (item_v2?.description) {
		item_v2.description = parseText(item_v2.description);
	}

	// For the english version of the role, the value 'pointOfContact' is really common.
	// We can replace it with the more readable 'point of contact'.
	if (item_v2?.contact?.[0]?.role) {
		item_v2.contact[0].role = item_v2.contact[0].role.replace('pointOfContact', 'point of contact');
	}

	// Sometimes, the organisation list in the distributor array has duplicate entries,
	// those will be filtered out here.
	if (item_v2.distributor) {
		item_v2.distributor.forEach((dist, i) => {
			if (dist) {
				// Filter for unique values with a new Set object
				const orgs = [...new Set(dist.organisation[lang].split('; '))];
				// convert back to string
				dist.organisation = orgs.length > 0 ? orgs.join('; ') : '';
			} else {
				item_v2.distributor[i] = { organisation: '' };
			}
		});
	} else {
		item_v2.distributor = [{ organisation: '' }];
	}

	// If coordinates are a string, convert them to an array (or nested arrays) instead
	let coords = item_v2.coordinates ?? [];

	if (typeof item_v2.coordinates == 'string') {
		coords = JSON.parse(coords);
		item_v2.coordinates = coords;
	}

	// We can also add a bounding box key to get the north, east, west, and south
	// values for the advanced metadata. But first, we need to get the values from
	// the coordinates
	let west = Infinity;
	let east = -Infinity;
	let south = Infinity;
	let north = -Infinity;

	coords.flat().forEach(([x, y]) => {
		if (x < west) west = x; // West
		if (x > east) east = x; // East
		if (y < south) south = y; // South
		if (y > north) north = y; // North
	});

	item_v2.bbox = {
		north: north,
		east: east,
		south: south,
		west: west
	};

	// Parse the topicCategory items into an array.
	// Sometimes the categories are in one single camel case string like this:
	// "climatologyMeteorologyAtmosphere" we'll also consider cases where there is
	// a comma-separated or semi-colon-separated list. We can do this with regular expressions.
	if (item_v2.topicCategory && typeof item_v2.topicCategory == 'string') {
		item_v2.topicCategory = item_v2.topicCategory.split(/[;,]/).map((item) => {
			// Insert space before a capital letter, but only if it's preceded
			// by a lowercase letter i.e. this ensures there is no space added
			// for acronyms so, for example, NRCan does not become N R Can.
			return item.replace(/([a-z])([A-Z])/g, '$1 $2');
		});
	}

	const canonicalUrl = url.origin + '/' + params.lang + '/map-browser/record/' + params.uuid;
	const alternateLang = params.lang == 'fr-ca' ? 'en-ca' : 'fr-ca';
	const alternateUrl = url.href.replace(params.lang, alternateLang);
	const metaDescription =
		params.lang == 'fr-ca'
			? "La page de métadonnées et la carte de l'enregistrement GeoCore " + params.uuid
			: 'The metadata page and map for the GeoCore record ' + params.uuid;

	item_v2.title = item_v2['title_' + lang];
	return {
		t_title_1: {
			text:
				params.lang == 'en-ca' ? 'Geospatial Data Catalog' : 'Catalogue de données géospatiales',
			href: url.origin + '/' + params.lang + '/map-browser'
		},
		t_title_2: {
			text: params.lang == 'en-ca' ? 'Metadata' : 'Métadonnées',
			href: url.href
		},
		lang: params.lang,
		uuid: params.uuid,
		similar: similar,
		related: related,
		analyticRes: analyticRes,
		t: t,
		item_v2: item_v2,
		canonicalUrl: canonicalUrl,
		alternateUrl: alternateUrl,
		alternateLang: alternateLang,
		metaDescription: metaDescription
	};

	function generateUrl(fetch, uuid, lang, token, ip) {
		let url = new URL(`${GEOCORE_API_DOMAIN}/id/v2?id=${uuid}&lang=${lang}`);
		console.log(url.href);
		return fetch(url, {
			headers: {
				Authentication: 'Bearer ' + token,
				'x-forwarded-for': ip
			}
		});
	}
};
