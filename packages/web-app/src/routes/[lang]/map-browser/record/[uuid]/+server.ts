import type { GeospatialRecord } from '$lib/db/db-types.js';
import { json } from '@sveltejs/kit';

const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

/**
 * Handles GET requests to fetch records by IDs.
 *
 * @param request - The request object.
 * @returns A promise that resolves to the record response.
 */
export async function GET({ url, request, fetch }): Promise<Response> {
  const idsParam = url.searchParams.get('id'); 
  const lang = url.searchParams.get('lang') ?? 'en';

  if (!idsParam) {
    return json({ error: 'Missing IDs' }, { status: 400 });
  }

  const ids = idsParam.split(',');

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '';

  const records: GeospatialRecord[] = await getRecordsByIds(ids, lang, fetch, ip);

  return json(records);
}


/**
 * Gets a record from the GeoCore API.
 *
 * @param id - The record ID.
 * @param lang - The language code.
 * @returns A promise that resolves to the fetch response.
 */
async function getRecord(
  id: string,
  lang: string,
  fetch: typeof globalThis.fetch,
  ip: string
): Promise<Response> {
  const url = new URL(`${GEOCORE_API_DOMAIN}/id/v2`);

  const params = {
    id,
    lang: lang.split('-')[0],
  };

  url.search = new URLSearchParams(params).toString();

  const response = await fetch(url, {
    headers: {
      'x-forwarded-for': ip,
    },
  });

  return response;
}

/**
 * Gets multiple records from the GeoCore API.
 *
 * @param idIterator - An array of record IDs.
 * @param lang - The language code.
 * @returns A promise that resolves to an array of records.
 */
async function getRecordsByIds(
  idIterator: string[], 
  lang: string,
  fetch: typeof globalThis.fetch,
  ip: string
): Promise<GeospatialRecord[]> {
  let promises = [];

  for (const id of idIterator) {
    promises.push(getRecord(id, lang, fetch, ip));
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
