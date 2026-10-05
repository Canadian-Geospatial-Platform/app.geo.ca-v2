/**
 * Sanitizes a map configuration by removing large/redundant data that will be
 * reconstructed from the server, reducing storage size significantly.
 *
 * Removes:
 * - Full layer style definitions (icons, symbols, colors - served by map server)
 * - Detailed metadata URLs
 * - Core package configurations (reconstructed from map-browser)
 *
 * Keeps:
 * - Map view state (zoom, center, rotation, bounds)
 * - Layer visibility/opacity states
 * - Selected tabs and layer paths
 * - Map interaction mode
 * - Theme
 *
 * @param config - Raw map configuration payload.
 * @returns Sanitized map configuration safe for storage.
 */
export function sanitizeMapConfigForStorage(config: unknown): unknown {
  if (typeof config !== 'object' || config === null) {
    return config;
  }

  const obj = config as Record<string, unknown>;

  // Create a shallow copy to avoid mutating the original
  const sanitized: Record<string, unknown> = {};

  // Keep these top-level properties
  const keepTopLevel = [
    'schemaVersionUsed',
    'theme',
    'globalSettings',
    'footerBar',
    'appBar',
    'navBar',
    'map',
    'viewSettings',
    'externalPackages',
    'components',
    'overviewMap',
  ];

  for (const key of keepTopLevel) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }

  // Process map config to remove redundant data
  if (obj.map && typeof obj.map === 'object') {
    sanitized.map = sanitizeMapObject(obj.map as Record<string, unknown>);
  }

  return sanitized;
}

/**
 * Removes layer style definitions which are large and redundant.
 * Keeps only visibility, opacity, and bounds states.
 *
 * @param mapObj - Map-level configuration object.
 * @returns Map configuration with reduced layer payload.
 */
function sanitizeMapObject(mapObj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  // Keep map-level properties
  if ('interaction' in mapObj) sanitized.interaction = mapObj.interaction;
  if ('basemapOptions' in mapObj) sanitized.basemapOptions = mapObj.basemapOptions;
  if ('highlightColor' in mapObj) sanitized.highlightColor = mapObj.highlightColor;
  if ('overlayObjects' in mapObj) sanitized.overlayObjects = mapObj.overlayObjects;
  if ('viewSettings' in mapObj) sanitized.viewSettings = mapObj.viewSettings;

  // Process layer configs - keep structure but remove styles
  if ('listOfGeoviewLayerConfig' in mapObj && Array.isArray(mapObj.listOfGeoviewLayerConfig)) {
    sanitized.listOfGeoviewLayerConfig = (mapObj.listOfGeoviewLayerConfig as unknown[]).map((layerConfig) =>
      sanitizeGeoviewLayerConfig(layerConfig)
    );
  }

  return sanitized;
}

/**
 * Sanitizes a geoview layer config by removing style definitions.
 * Keeps the layer hierarchy, IDs, and state information.
 *
 * @param config - Candidate GeoView layer config.
 * @returns Sanitized GeoView layer config.
 */
function sanitizeGeoviewLayerConfig(config: unknown): unknown {
  if (typeof config !== 'object' || config === null) {
    return config;
  }

  const obj = config as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  // Keep structural and state properties
  const keepProps = [
    'geoviewLayerId',
    'geoviewLayerName',
    'geoviewLayerType',
    'isTimeAware',
    'metadataAccessPath',
    'initialSettings',
    'listOfLayerEntryConfig',
  ];

  for (const prop of keepProps) {
    if (prop in obj) {
      if (prop === 'listOfLayerEntryConfig' && Array.isArray(obj[prop])) {
        sanitized[prop] = (obj[prop] as unknown[]).map((entry) => sanitizeLayerEntryConfig(entry));
      } else {
        sanitized[prop] = obj[prop];
      }
    }
  }

  return sanitized;
}

/**
 * Sanitizes a layer entry config by removing layerStyle and source data.
 *
 * @param config - Candidate layer entry config.
 * @returns Sanitized layer entry config.
 */
function sanitizeLayerEntryConfig(config: unknown): unknown {
  if (typeof config !== 'object' || config === null) {
    return config;
  }

  const obj = config as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  // Keep structural and state properties, exclude large style/source data
  const keepProps = ['entryType', 'layerId', 'layerName', 'initialSettings', 'listOfLayerEntryConfig'];

  for (const prop of keepProps) {
    if (prop in obj) {
      if (prop === 'listOfLayerEntryConfig' && Array.isArray(obj[prop])) {
        sanitized[prop] = (obj[prop] as unknown[]).map((entry) => sanitizeLayerEntryConfig(entry));
      } else {
        sanitized[prop] = obj[prop];
      }
    }
  }

  // Remove: layerStyle (large), source (redundant), detailed metadata
  // These will be reconstructed from the map server when loading

  return sanitized;
}
