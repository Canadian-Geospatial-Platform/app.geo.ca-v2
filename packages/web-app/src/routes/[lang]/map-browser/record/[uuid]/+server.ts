import type { GeospatialRecord } from '#lib/db/db-types.js';
import type { RequestEvent } from '@sveltejs/kit';
import { getAppLanguage, getContentLanguage, type AppLanguage } from '#lib/utils/language.js';

/**
 * Handles POST requests to fetch records by IDs.
 *
 * @param event - The request event object.
 * @returns A promise that resolves to the record response.
 */
export async function POST({ request }: RequestEvent): Promise<Response> {
  const { ids, lang: requestedLanguage } = await request.json();

  if (!Array.isArray(ids)) {
    return Response.json({ error: 'Invalid IDs' }, { status: 400 });
  }

  const records: GeospatialRecord[] = await getRecordsByIds(ids, getAppLanguage(requestedLanguage));

  return Response.json(records);
}

/**
 * Gets a record from the GeoCore API.
 *
 * @param id - The record ID.
 * @param appLang - The language code.
 * @returns A promise that resolves to the fetch response.
 */
function getRecord(id: string, appLang: AppLanguage): Promise<Response> {
  const url = new URL(`${process.env.GEOCORE_API_DOMAIN}/id/v2`);
  const params = {
    id: id,
    lang: getContentLanguage(appLang),
  };
  url.search = new URLSearchParams(params).toString();
  return fetch(url);
}

/**
 * Gets multiple records from the GeoCore API.
 *
 * @param idIterator - An array of record IDs.
 * @param appLang - The language code.
 * @returns A promise that resolves to an array of records.
 */
async function getRecordsByIds(idIterator: string[], appLang: AppLanguage): Promise<GeospatialRecord[]> {
  const promises: Promise<Response>[] = [];

  for (const id of idIterator) {
    promises.push(getRecord(id, appLang));
  }

  const results = await Promise.all(promises);

  const ret = await Promise.all(
    results.map(async (result: Response) => {
      try {
        const contents = await result.json();
        if (contents?.body?.Items[0]) return contents.body.Items[0] as GeospatialRecord;
      } catch (error) {
        console.log(error);
      }
      return null;
    })
  );
  return ret.filter((item): item is GeospatialRecord => item !== null);
}
