/** Distinguishes a new live-map addition from a dataset already included in the map. */
export type DatasetAdditionResult = 'added' | 'already-present';

/** GeoView API surface required to add a dataset once the map is ready. */
export interface DatasetMapViewer {
  waitForMapReady(): Promise<void>;
  layer: {
    getGeoviewLayerIds(): string[];
    addGeoviewLayerByGeoCoreUUID(id: string): Promise<{ promiseLayer: Promise<void> } | undefined>;
  };
}

/**
 * Adds a GeoCore dataset to the live viewer without persisting the map configuration.
 *
 * Waits for map readiness, not existing layers, before checking for duplicates, then awaits the new
 * layer's completion promise rather than treating its creation as success.
 *
 * @param viewer - Initialized GeoView viewer containing the saved map.
 * @param datasetId - GeoCore dataset identifier to add.
 * @param signal - Prevents starting an addition if the caller unmounts while waiting.
 * @returns Whether a layer was added or the dataset was already present.
 * @throws If map loading, dataset lookup, or layer creation fails, or the signal is aborted before adding.
 */
export async function addDatasetToMap(viewer: DatasetMapViewer, datasetId: string, signal?: AbortSignal): Promise<DatasetAdditionResult> {
  signal?.throwIfAborted();
  await viewer.waitForMapReady();
  signal?.throwIfAborted();
  // GeoView appends ":<generated-id>" when the same GeoCore dataset is added more than once.
  const alreadyPresent = viewer.layer.getGeoviewLayerIds().some((id) => id.split(':')[0].toLowerCase() === datasetId.toLowerCase());
  if (alreadyPresent) return 'already-present';

  const result = await viewer.layer.addGeoviewLayerByGeoCoreUUID(datasetId);
  if (!result) throw new Error(`Unable to add dataset ${datasetId} to the map.`);
  await result.promiseLayer;
  return 'added';
}
