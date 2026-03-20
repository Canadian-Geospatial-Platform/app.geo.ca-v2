import type { GeospatialRecord } from '$lib/db/db-types';

/**
 * Sanitizes the given results by filtering, fixing coordinate types, and normalizing language fields.
 *
 * @param results - The array of results to sanitize.
 * @param lang - The language code for normalization.
 * @returns The sanitized array of results.
 */
function sanitize(results: GeospatialRecord[], lang: string): GeospatialRecord[] {
  let truthyResults = results.filter((result) => result);
  let fixedCoordsResults = fixCoordinatesType(truthyResults);
  let normalizedLanguagedResults = normalizeLanguage(fixedCoordsResults, lang);
  return normalizedLanguagedResults;
}

/**
 * Fixes the coordinate types in the given results by parsing them from JSON strings.
 *
 * @param results - The array of results with coordinates to fix.
 * @returns The array of results with fixed coordinate types.
 */
function fixCoordinatesType(results: GeospatialRecord[]): GeospatialRecord[] {
  results.forEach((result) => {
    result.coordinates = JSON.parse(result.coordinates);
  });

  return results;
}

/**
 * Normalizes the language fields in the given records based on the provided language code.
 *
 * @param records - The array of records to normalize.
 * @param lang - The language code for normalization.
 * @returns The array of records with normalized language fields.
 */
function normalizeLanguage(records: GeospatialRecord[], lang: string): GeospatialRecord[] {
  for (const record of records) {
    try {
      let title = record[`title_${lang.split('-')[0]}` as 'title_en' | 'title_fr'];
      if (title) {
        record.title = title;
      }

      // TODO: Should this be description? Why is description being set to the title?
      let description = record[`title_${lang.split('-')[0]}` as 'title_en' | 'title_fr'];
      if (description) {
        record.description = description;
      }
    } catch (error: any) {
      console.warn('error normalizing data: \n', record, '\n', error);
    }
  }
  return records;
}

export { sanitize };
