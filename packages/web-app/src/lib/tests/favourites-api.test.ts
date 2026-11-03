/**
 * Test coverage: Route tests for favourites API map configuration mutations and persistence calls.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapConfigFavourite } from '#lib/db/db-types.js';

vi.mock('#lib/db/user.js', () => ({
  getUserData: vi.fn(),
  putUserData: vi.fn(),
}));

import { DELETE, PATCH, POST, PUT } from '../../routes/[lang]/api/favourites/+server';
import { getUserData, putUserData } from '#lib/db/user.js';

const mockedGetUserData = vi.mocked(getUserData);
const mockedPutUserData = vi.mocked(putUserData);

/**
 * Creates a JSON request for the favourites API test route.
 *
 * @param method - HTTP method to use.
 * @param payload - Optional JSON payload sent to the route.
 * @returns Request configured with the given method and JSON body.
 */
function createFavouritesRequest(method: string, payload?: Record<string, unknown>): Request {
  return new Request('http://localhost/en-ca/api/favourites', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

/**
 * Creates a PATCH request for the favourites API test route.
 *
 * @param payload - JSON payload sent to the route.
 * @returns Request configured for PATCH with JSON body.
 */
function createPatchRequest(payload: Record<string, unknown>): Request {
  return createFavouritesRequest('PATCH', payload);
}

describe('PATCH /[lang]/api/favourites map config mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPutUserData.mockResolvedValue({ ok: true });
  });

  it('creates a map config and auto-renames on name collision', async () => {
    const existingMaps: MapConfigFavourite[] = [
      {
        id: 'map-1',
        name: 'My Map',
        config: { map: { interaction: 'dynamic' } },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-1',
        favourites: [],
        mapConfigs: existingMaps,
      },
    });

    const response = await PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'createMapConfig',
        name: 'My Map',
        config: { map: { interaction: 'dynamic' } },
      }),
    } as never);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; mapConfigs: MapConfigFavourite[] };

    expect(payload.ok).toBe(true);
    expect(payload.mapConfigs).toHaveLength(2);
    expect(payload.mapConfigs[1].name).toBe('My Map 2');
    expect(payload).toHaveProperty('mapConfigId', payload.mapConfigs[1].id);
    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
  });

  it('deletes a map config by id', async () => {
    const existingMaps: MapConfigFavourite[] = [
      {
        id: 'map-1',
        name: 'First',
        config: { a: 1 },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'map-2',
        name: 'Second',
        config: { a: 2 },
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ];

    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-1',
        favourites: ['abc'],
        mapConfigs: existingMaps,
      },
    });

    const response = await PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'deleteMapConfig',
        id: 'map-1',
      }),
    } as never);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; mapConfigs: MapConfigFavourite[] };

    expect(payload.ok).toBe(true);
    expect(payload.mapConfigs).toEqual([
      {
        id: 'map-2',
        name: 'Second',
        config: { a: 2 },
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
  });

  it('returns limit error when map count reaches 25', async () => {
    const existingMaps: MapConfigFavourite[] = Array.from({ length: 25 }, (_, index) => ({
      id: `map-${index + 1}`,
      name: `My Map ${index + 1}`,
      config: { index },
      createdAt: '2026-01-01T00:00:00.000Z',
    }));

    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-1',
        favourites: [],
        mapConfigs: existingMaps,
      },
    });

    const response = await PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'createMapConfig',
        name: 'Overflow',
        config: { map: {} },
      }),
    } as never);

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; reason: string; mapConfigs: MapConfigFavourite[] };

    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('limit');
    expect(payload.mapConfigs).toHaveLength(25);
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('rejects uploaded map configs that do not contain a map object', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-1',
        favourites: [],
        mapConfigs: [],
      },
    });

    const response = await PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'createMapConfig',
        name: 'Imported',
        config: { viewSettings: { some: 'value' } },
      }),
    } as never);

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; reason: string };

    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('invalid-config');
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('sanitizes uploaded map configs before persistence', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-1',
        favourites: [],
        mapConfigs: [],
      },
    });

    const response = await PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'createMapConfig',
        name: 'Imported',
        config: {
          map: {
            interaction: 'dynamic',
            listOfGeoviewLayerConfig: [
              {
                geoviewLayerId: 'layer-1',
                geoviewLayerType: 'geoCore',
                metadataAccessPath: 'https://example.test/metadata',
                unexpectedLayerProp: true,
              },
            ],
          },
          theme: 'geo.ca',
          unexpectedTopLevel: { keepMe: false },
        },
      }),
    } as never);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; mapConfigs: MapConfigFavourite[] };

    expect(payload.ok).toBe(true);
    expect(payload.mapConfigs).toHaveLength(1);
    expect(payload.mapConfigs[0].config).not.toHaveProperty('unexpectedTopLevel');
    expect(payload.mapConfigs[0].config).toMatchObject({
      map: {
        interaction: 'dynamic',
        listOfGeoviewLayerConfig: [
          {
            geoviewLayerId: 'layer-1',
            geoviewLayerType: 'geoCore',
          },
        ],
      },
      theme: 'geo.ca',
    });
    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
  });

  it('rejects uploaded map configs containing unsafe object keys', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: {
        uuid: 'user-1',
        favourites: [],
        mapConfigs: [],
      },
    });

    const unsafeConfig = JSON.parse('{"map":{},"components":{"__proto__":{"polluted":true}}}') as Record<string, unknown>;

    const response = await PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'createMapConfig',
        name: 'Imported',
        config: unsafeConfig,
      }),
    } as never);

    expect(response.status).toBe(400);
    const payload = (await response.json()) as { ok: boolean; reason: string };

    expect(payload.ok).toBe(false);
    expect(payload.reason).toBe('invalid-config');
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });
});

describe('PATCH /[lang]/api/favourites updateMapConfig', () => {
  const originalMap: MapConfigFavourite = {
    id: 'map-1',
    name: 'Original',
    config: { map: { interaction: 'dynamic' } },
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const otherMap: MapConfigFavourite = { ...originalMap, id: 'map-2', name: 'Other' };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a'], mapConfigs: [originalMap, otherMap] },
    });
    mockedPutUserData.mockResolvedValue({ ok: true });
  });

  async function updateMap(payload: Record<string, unknown> = {}): Promise<Response> {
    return PATCH({
      cookies: {} as never,
      request: createPatchRequest({
        action: 'updateMapConfig',
        id: 'map-1',
        config: { map: { viewSettings: { initialView: { zoomAndCenter: [5, [-100, 68]] } } } },
        ...payload,
      }),
    } as never);
  }

  it('overwrites only the matching config, preserving metadata, other maps and datasets', async () => {
    const config = { map: { interaction: 'static' }, theme: 'geo.ca', unexpectedTopLevel: true };
    const response = await updateMap({ name: 'Must not rename', config });

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; mapConfigs: MapConfigFavourite[] };
    const expectedMaps = [{ ...originalMap, config: { map: { interaction: 'static' }, theme: 'geo.ca' } }, otherMap];
    expect(payload).toEqual({ ok: true, mapConfigs: expectedMaps, mapConfigId: originalMap.id });
    expect(mockedPutUserData).toHaveBeenCalledExactlyOnceWith({ uuid: 'user-1', favourites: ['dataset-a'], mapConfigs: expectedMaps }, {});
    expect(originalMap.config).toEqual({ map: { interaction: 'dynamic' } });
  });

  it('allows overwriting at the 25-map limit without adding a map', async () => {
    const maps = Array.from({ length: 25 }, (_, index) => ({ ...originalMap, id: `map-${index + 1}` }));
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: [], mapConfigs: maps },
    });

    const response = await updateMap();

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { mapConfigs: MapConfigFavourite[] };
    expect(payload.mapConfigs).toHaveLength(25);
    expect(payload.mapConfigs[0].config).toEqual({
      map: { viewSettings: { initialView: { zoomAndCenter: [5, [-100, 68]] } } },
    });
    expect(payload.mapConfigs.slice(1)).toEqual(maps.slice(1));
  });

  it.each([undefined, '', '  ', 12])('rejects invalid ID %s without writing', async (id) => {
    const response = await updateMap({ id });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'invalid-id' });
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('rejects IDs absent from this user profile instead of creating a replacement', async () => {
    const response = await updateMap({ id: 'deleted-or-other-users-map' });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ ok: false, reason: 'not-found', mapConfigs: [originalMap, otherMap] });
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it.each([null, [], { viewSettings: {} }, JSON.parse('{"map":{},"components":{"__proto__":{"polluted":true}}}')])(
    'rejects invalid or unsafe configurations without writing: %j',
    async (config) => {
      const response = await updateMap({ config });

      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ ok: false, reason: 'invalid-config' });
      expect(mockedPutUserData).not.toHaveBeenCalled();
    }
  );

  it.each([
    { status: 'anonymous', uuid: null, httpStatus: 401 },
    { status: 'unavailable', uuid: 'user-1', httpStatus: 503 },
  ] as const)('rejects $status user data without writing', async ({ status, uuid, httpStatus }) => {
    mockedGetUserData.mockResolvedValue({ status, Item: { uuid, favourites: [], mapConfigs: [] } });

    const response = await updateMap();

    expect(response.status).toBe(httpStatus);
    expect(await response.json()).toMatchObject({ ok: false });
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it.each([300000, 300001])('enforces the exact UTF-8 item-size boundary (%i bytes)', async (size) => {
    const config = { map: {}, globalSettings: { padding: '' } };
    const expectedItem = {
      uuid: 'user-1',
      favourites: ['dataset-a'],
      mapConfigs: [{ ...originalMap, config }, otherMap],
    };
    const baseSize = new TextEncoder().encode(JSON.stringify(expectedItem)).byteLength;
    config.globalSettings.padding = 'x'.repeat(size - baseSize);

    const response = await updateMap({ config });

    expect(response.status).toBe(size === 300000 ? 200 : 400);
    if (size === 300000) {
      expect(mockedPutUserData).toHaveBeenCalledTimes(1);
    } else {
      expect(await response.json()).toMatchObject({ ok: false, reason: 'item-too-large' });
      expect(mockedPutUserData).not.toHaveBeenCalled();
    }
  });

  it('measures non-ASCII configuration content in bytes rather than characters', async () => {
    const response = await updateMap({ config: { map: {}, globalSettings: { padding: '\u00e9'.repeat(150000) } } });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, reason: 'item-too-large' });
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('reports persistence failure without returning the unsaved config as saved', async () => {
    mockedPutUserData.mockResolvedValue({ ok: false });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await updateMap();

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ ok: false, reason: 'persist-failed', mapConfigs: [originalMap, otherMap] });
      expect(log).toHaveBeenCalledWith('Failed to persist map config.', { action: 'updateMapConfig', mapCount: 2 });
    } finally {
      log.mockRestore();
    }
  });
});

describe('POST /[lang]/api/favourites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPutUserData.mockResolvedValue({ ok: true });
  });

  it('adds a record id to favourites and persists', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a'], mapConfigs: [] },
    });

    const response = await POST({
      cookies: {} as never,
      request: createFavouritesRequest('POST', { id: 'dataset-b' }),
    } as never);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; favourites: string[] };
    expect(payload.ok).toBe(true);
    expect(payload.favourites).toEqual(['dataset-a', 'dataset-b']);
    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
  });

  it('deduplicates when the id is already a favourite', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a'], mapConfigs: [] },
    });

    const response = await POST({
      cookies: {} as never,
      request: createFavouritesRequest('POST', { id: 'dataset-a' }),
    } as never);

    const payload = (await response.json()) as { favourites: string[] };
    expect(payload.favourites).toEqual(['dataset-a']);
  });

  it('rejects a missing or blank id', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a'], mapConfigs: [] },
    });

    const response = await POST({
      cookies: {} as never,
      request: createFavouritesRequest('POST', { id: '  ' }),
    } as never);

    expect(response.status).toBe(400);
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('rejects when there is no signed-in user', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'missing',
      Item: { uuid: null, favourites: [], mapConfigs: [] },
    });

    const response = await POST({
      cookies: {} as never,
      request: createFavouritesRequest('POST', { id: 'dataset-a' }),
    } as never);

    expect(response.status).toBe(401);
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });
});

describe('DELETE /[lang]/api/favourites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPutUserData.mockResolvedValue({ ok: true });
  });

  it('removes a record id from favourites and persists', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a', 'dataset-b'], mapConfigs: [] },
    });

    const response = await DELETE({
      cookies: {} as never,
      request: createFavouritesRequest('DELETE', { id: 'dataset-a' }),
    } as never);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; favourites: string[] };
    expect(payload.ok).toBe(true);
    expect(payload.favourites).toEqual(['dataset-b']);
    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing or blank id', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a'], mapConfigs: [] },
    });

    const response = await DELETE({
      cookies: {} as never,
      request: createFavouritesRequest('DELETE', {}),
    } as never);

    expect(response.status).toBe(400);
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });

  it('rejects when there is no signed-in user', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'missing',
      Item: { uuid: null, favourites: [], mapConfigs: [] },
    });

    const response = await DELETE({
      cookies: {} as never,
      request: createFavouritesRequest('DELETE', { id: 'dataset-a' }),
    } as never);

    expect(response.status).toBe(401);
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });
});

describe('PUT /[lang]/api/favourites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPutUserData.mockResolvedValue({ ok: true });
  });

  it('clears all favourites and persists', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'ok',
      Item: { uuid: 'user-1', favourites: ['dataset-a', 'dataset-b'], mapConfigs: [] },
    });

    const response = await PUT({ cookies: {} as never } as never);

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { ok: boolean; favourites: string[] };
    expect(payload.ok).toBe(true);
    expect(payload.favourites).toEqual([]);
    expect(mockedPutUserData).toHaveBeenCalledTimes(1);
  });

  it('rejects when there is no signed-in user', async () => {
    mockedGetUserData.mockResolvedValue({
      status: 'missing',
      Item: { uuid: null, favourites: [], mapConfigs: [] },
    });

    const response = await PUT({ cookies: {} as never } as never);

    expect(response.status).toBe(401);
    expect(mockedPutUserData).not.toHaveBeenCalled();
  });
});
