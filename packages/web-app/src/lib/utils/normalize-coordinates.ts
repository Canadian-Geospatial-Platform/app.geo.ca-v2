/**
 * Type guard to check if a value is a coordinate pair [number, number].
 */
function isCoordinatePair(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number';
}

/**
 * Normalizes raw coordinate data to a flattened number[][] format.
 *
 * Handles both:
 * - number[][] (single polygon ring)
 * - number[][][] (GeoJSON polygon with outer/inner rings) - returns outer ring
 *
 * @param value - The raw coordinate data (typically from GeoJSON or API response)
 * @param allowNull - If true, returns null on parse failure; if false, returns empty array
 * @returns Normalized coordinates or null/[] on failure
 */
export function normalizeCoordinates(value: unknown, allowNull = false): number[][] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return allowNull ? null : [];
  }

  // Case: number[][] (single polygon ring)
  if (isCoordinatePair(value[0])) {
    return value as number[][];
  }

  // Case: number[][][] (GeoJSON Polygon), use outer ring
  const outerRing = value[0];
  if (!Array.isArray(outerRing) || outerRing.length === 0) {
    return allowNull ? null : [];
  }

  if (isCoordinatePair(outerRing[0])) {
    return outerRing as number[][];
  }

  return allowNull ? null : [];
}
