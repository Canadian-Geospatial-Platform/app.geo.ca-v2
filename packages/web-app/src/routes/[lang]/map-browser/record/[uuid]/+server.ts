import type { GeospatialRecord } from '$lib/db/db-types.js';
import { json } from '@sveltejs/kit';

const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

/**
 * Handles POST requests to fetch records by IDs.
 *
 * @param request - The request object.
 * @returns A promise that resolves to the record response.
 */
export async function POST({ request }): Promise<Response> {
	const { ids, lang } = await request.json();

	if (!Array.isArray(ids)) {
		return json({ error: 'Invalid IDs' }, { status: 400 });
	}

	const records: GeospatialRecord[] = await getRecordsByIds(ids, lang);

	return json(records);
}

/**
 * Gets a record from the GeoCore API.
 *
 * @param id - The record ID.
 * @param lang - The language code.
 * @returns A promise that resolves to the fetch response.
 */
function getRecord(id: string, lang: string): Promise<Response> {
	const url = new URL(`${GEOCORE_API_DOMAIN}/id/v2`);
	const params = {
		id: id,
		lang: lang.split('-')[0]
	};
	url.search = new URLSearchParams(params).toString();
	return fetch(url);
}

/**
 * Gets multiple records from the GeoCore API.
 *
 * @param idIterator - An array of record IDs.
 * @param lang - The language code.
 * @returns A promise that resolves to an array of records.
 */
async function getRecordsByIds(idIterator: string[], lang: string): Promise<GeospatialRecord[]> {
	let promises = [];

	for (const id of idIterator) {
		promises.push(getRecord(id, lang));
	}

	const results = await Promise.all(promises);

	let ret = await Promise.all(
		results.map(async (result: Response) => {
			try {
				const contents = await result.json();
				if (contents?.body?.Items[0]) return contents.body.Items[0];
			} catch (error) {
				console.log(error);
			}
		})
	);
	return ret;
}
