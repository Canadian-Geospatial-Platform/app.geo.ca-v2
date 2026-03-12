import type { GeospatialRecord } from '$lib/db/db-types';

type SemanticFeature = {
	properties: GeospatialRecord;
	geometry: {
		coordinates: number[][];
	};
};

type SemanticResult = {
	features: SemanticFeature[];
};

type SemanticResultWithCoordinates = Omit<GeospatialRecord, 'coordinates'> & {
	coordinates: number[][];
};

/**
 * Sanitizes semantic results by extracting properties and coordinates.
 *
 * @param results - The array of semantic results to sanitize.
 * @returns The sanitized array of semantic results.
 */
export function sanitizeSemantic(results: SemanticResult[]): SemanticResultWithCoordinates[] {
	if (!results) {
		return [];
	}

	// Keep only valid results
	let truthyResults = results.filter((result) => result);

	// For each result, get the properties and coordinates
	let features = truthyResults.map((truthyResult: SemanticResult) => {
		let properties = truthyResult.features[0].properties;
		let coords = truthyResult.features[0].geometry.coordinates;
		return {
			...properties,
			coordinates: coords
		};
	});

	return features;
}
