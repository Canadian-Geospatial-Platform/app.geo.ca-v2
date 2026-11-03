import { describe, expect, it, vi } from 'vitest';
import { addDatasetToMap, type DatasetMapViewer } from '#lib/utils/map-dataset.js';

function createViewer(ids: string[] = []) {
  return {
    waitForMapReady: vi.fn<DatasetMapViewer['waitForMapReady']>().mockResolvedValue(undefined),
    layer: {
      getGeoviewLayerIds: vi.fn().mockReturnValue(ids),
      addGeoviewLayerByGeoCoreUUID: vi
        .fn<DatasetMapViewer['layer']['addGeoviewLayerByGeoCoreUUID']>()
        .mockResolvedValue({ promiseLayer: Promise.resolve() }),
    },
  } satisfies DatasetMapViewer;
}

describe('adding a dataset to a saved map', () => {
  it('waits for map readiness before checking or adding the dataset', async () => {
    const viewer = createViewer();
    let ready!: () => void;
    viewer.waitForMapReady.mockReturnValue(new Promise<void>((resolve) => (ready = resolve)));

    const addition = addDatasetToMap(viewer, 'dataset-id');
    expect(viewer.layer.getGeoviewLayerIds).not.toHaveBeenCalled();
    expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).not.toHaveBeenCalled();

    ready();
    await expect(addition).resolves.toBe('added');
    expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).toHaveBeenCalledExactlyOnceWith('dataset-id');
  });

  it('adds the dataset without waiting for existing layers to load', async () => {
    const viewer = {
      ...createViewer(['existing-dataset']),
      waitForLayersLoaded: vi.fn(() => new Promise<number>(() => {})),
    };

    await expect(addDatasetToMap(viewer, 'dataset-id')).resolves.toBe('added');
    expect(viewer.waitForMapReady).toHaveBeenCalledOnce();
    expect(viewer.waitForLayersLoaded).not.toHaveBeenCalled();
    expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).toHaveBeenCalledExactlyOnceWith('dataset-id');
  });

  it('does not report success until the layer completion promise resolves', async () => {
    const viewer = createViewer();
    let layerLoaded!: () => void;
    viewer.layer.addGeoviewLayerByGeoCoreUUID.mockResolvedValue({
      promiseLayer: new Promise<void>((resolve) => (layerLoaded = resolve)),
    });
    const finished = vi.fn();
    const addition = addDatasetToMap(viewer, 'dataset-id').then(finished);
    await vi.waitFor(() => expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).toHaveBeenCalled());
    expect(finished).not.toHaveBeenCalled();
    layerLoaded();
    await addition;
    expect(finished).toHaveBeenCalledWith('added');
  });

  it.each(['dataset-id', 'DATASET-ID', 'dataset-id:generated-suffix'])('skips an existing dataset identified by %s', async (id) => {
    const viewer = createViewer([id]);
    await expect(addDatasetToMap(viewer, 'dataset-id')).resolves.toBe('already-present');
    expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).not.toHaveBeenCalled();
  });

  it('does not mistake a different dataset for a duplicate', async () => {
    const viewer = createViewer(['dataset-id-other']);
    await expect(addDatasetToMap(viewer, 'dataset-id')).resolves.toBe('added');
  });

  it('reports an undefined GeoView result as a failure', async () => {
    const viewer = createViewer();
    viewer.layer.addGeoviewLayerByGeoCoreUUID.mockResolvedValue(undefined);
    await expect(addDatasetToMap(viewer, 'dataset-id')).rejects.toThrow('Unable to add dataset');
  });

  it('propagates saved-map loading failures without attempting an addition', async () => {
    const viewer = createViewer();
    viewer.waitForMapReady.mockRejectedValue(new Error('Map loading failed'));
    await expect(addDatasetToMap(viewer, 'dataset-id')).rejects.toThrow('Map loading failed');
    expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).not.toHaveBeenCalled();
  });

  it('propagates dataset lookup failures', async () => {
    const viewer = createViewer();
    viewer.layer.addGeoviewLayerByGeoCoreUUID.mockRejectedValue(new Error('Dataset lookup failed'));
    await expect(addDatasetToMap(viewer, 'dataset-id')).rejects.toThrow('Dataset lookup failed');
  });

  it('propagates failures from the layer completion promise', async () => {
    const viewer = createViewer();
    viewer.layer.addGeoviewLayerByGeoCoreUUID.mockImplementation(async () => ({
      promiseLayer: Promise.reject(new Error('Layer loading failed')),
    }));
    await expect(addDatasetToMap(viewer, 'dataset-id')).rejects.toThrow('Layer loading failed');
  });

  it('does not add the dataset after navigating away while the saved map is loading', async () => {
    const viewer = createViewer();
    const controller = new AbortController();
    let ready!: () => void;
    viewer.waitForMapReady.mockReturnValue(new Promise<void>((resolve) => (ready = resolve)));

    const addition = addDatasetToMap(viewer, 'dataset-id', controller.signal);
    controller.abort();
    ready();

    await expect(addition).rejects.toMatchObject({ name: 'AbortError' });
    expect(viewer.layer.addGeoviewLayerByGeoCoreUUID).not.toHaveBeenCalled();
  });
});
