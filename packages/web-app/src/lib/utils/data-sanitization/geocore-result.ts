import type { GeospatialRecord } from '#lib/db/db-types.js';
import { getAppLanguage, getContentLanguage } from '#lib/utils/language.js';

/**
 * Sanitizes the given results by filtering, fixing coordinate types, and normalizing language fields.
 *
 * @param results - The array of results to sanitize.
 * @param inputLanguage - The language code for normalization.
 * @returns The sanitized array of results.
 */
function sanitize(results: GeospatialRecord[], inputLanguage: string): GeospatialRecord[] {
  const truthyResults = results.filter((result) => result);
  const fixedCoordsResults = fixCoordinatesType(truthyResults);
  const normalizedLanguagedResults = normalizeLanguage(fixedCoordsResults, inputLanguage);
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
 * @param inputLanguage - The language code for normalization.
 * @returns The array of records with normalized language fields.
 */
function normalizeLanguage(records: GeospatialRecord[], inputLanguage: string): GeospatialRecord[] {
  const contentLang = getContentLanguage(getAppLanguage(inputLanguage));

  for (const record of records) {
    try {
      const title = record[`title_${contentLang}` as 'title_en' | 'title_fr'];
      if (title) {
        record.title = title;
      }

      const description = (record as unknown as Record<'description_en' | 'description_fr', string | undefined>)[
        `description_${contentLang}` as 'description_en' | 'description_fr'
      ];
      if (description) {
        record.description = description;
      }
    } catch (error: unknown) {
      console.warn('error normalizing data: \n', record, '\n', error);
    }
  }
  return records;
}

export { sanitize };
