import type { DistributionOption, GeospatialRecord } from '$lib/db/db-types';
import { json } from '@sveltejs/kit';

const GEOCORE_API_DOMAIN = process.env.GEOCORE_API_DOMAIN;

interface LayerResult {
  layers: Array<{ id: string }>;
}

/**
 * Handles POST requests to fetch records by IDs and check for map layers.
 *
 * @param request - The request object.
 * @returns A promise that resolves to the record response.
 */
export async function POST({ request }: { request: Request }): Promise<Response> {
  const { ids, lang } = await request.json();

  if (!Array.isArray(ids)) {
    return json({ error: 'Invalid IDs' }, { status: 400 });
  }

  const records = await getRecordsByIds(ids, lang, request.headers.get('x-forwarded-for') || '');
  const idsWithLayers = await checkForMapLayers(ids, lang);

  // Update the record data with the following:
  //   (1) a list of resource formats
  //   (2) a boolean including if the resource has a map layer
  for (const record of records) {
    if (!record) continue;

    const formats = getFormats(record, lang);
    record.formats = formats;

    if (idsWithLayers.includes(record.id)) {
      record.hasMapLayer = true;
    } else {
      record.hasMapLayer = false;
    }
  }

  return json(records.filter((record) => record !== undefined));
}

/** Gets a record from the GeoCore API.
 *
 * @param id - The record ID.
 * @param lang - The language code.
 * @param ip - The IP address.
 * @returns A promise that resolves to the fetch response.
 */
function getRecord(id: string, lang: string, ip: string): Promise<Response> {
  const url = new URL(`${GEOCORE_API_DOMAIN}/id/v2`);
  const params = {
    id: id,
    lang: lang.split('-')[0],
    'x-forwarded-for': ip,
  };
  url.search = new URLSearchParams(params).toString();
  return fetch(url);
}

/**
 * Extracts and returns unique formats from a record's options.
 *
 * @param record - The record object.
 * @param lang - The language code.
 * @returns An array of unique formats.
 */
function getFormats(record: GeospatialRecord, lang: string): string[] {
  const options = record.options;

  // Get an array of just the format of each record option
  const formatArray = options.map((option: DistributionOption) => {
    const description = option.description;
    const descriptionString = lang === 'fr' ? description.fr : description.en;
    const descriptionArray = descriptionString ? descriptionString.split(';') : [];

    // The description string is always in this format 'type;format;language',
    // so when splitting the string to an array, we can get the format by returning
    // the item in the second array index.
    return descriptionArray[1];
  });

  // Note: In the geocore records, the protocol is sometimes listed as the string 'null',
  // not just the value null, so we should check for the string to filer it out.
  // We can also check for 'undefined' as a string too for good measure.
  // Using indexOf allows us to check for duplicate values since it always returns the
  // first instance of the value being searched. If it doesn't match the current index,
  // then it must be a duplicate.
  const filteredFormats = formatArray.filter((format: string, index: number, self: string[]) => {
    return format && format !== 'null' && format !== 'undefined' && self.indexOf(format) === index;
  });

  return filteredFormats;
}

/**
 * Query vcs to check if resources have map layers
 *
 * @param ids - An array of record IDs.
 * @param lang - The language code.
 * @returns A promise that resolves to an array of IDs that have map layers.
 */
async function checkForMapLayers(ids: string[], lang: string): Promise<string[]> {
  const langShort = lang.split('-')[0];
  let filteredIds = [];

  // Set url search params
  const url = new URL(`${GEOCORE_API_DOMAIN}/vcs`);
  const params = {
    id: ids.join(','),
    lang: langShort,
    referrer: 'geo.ca',
  };
  url.search = new URLSearchParams(params).toString();

  try {
    // Get data
    const response = await fetch(url);
    const results = await response.json();

    // Get a list of ids with map layers. For resources with no map layers
    const rcs = results.response.rcs;
    const layersArray = rcs[langShort];
    filteredIds = layersArray.map((result: LayerResult) => {
      // Since we are only checking if at least one layer exists,
      // we can stop at the first layer for each resource
      const layer = result.layers[0];
      const layerId = layer.id;

      // The rcs ids don't have the same format as the geocore ids, but
      // always contain the geocode id. For example an rcs layer id could look
      // like this: "rcs.03ccfb5c-a06e-43e3-80fd-09d4f8f69703.en". To get just the
      // geocore id, we can check with the includes method.
      for (const id of ids) {
        if (layerId.includes(id)) {
          return id;
        }
      }
    });
  } catch (error) {
    console.log(error);
  }

  return filteredIds;
}

/**
 * Gets multiple records from the GeoCore API.
 *
 * @param idIterator - An iterable of record IDs.
 * @param lang - The language code.
 * @param ip - The IP address.
 * @returns A promise that resolves to an array of records.
 */
async function getRecordsByIds(idIterator: Iterable<string>, lang: string, ip: string): Promise<GeospatialRecord[]> {
  const promises = [];

  for (const id of idIterator) {
    promises.push(getRecord(id, lang, ip));
  }

  const results = await Promise.all(promises);

  const ret = await Promise.all(
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
