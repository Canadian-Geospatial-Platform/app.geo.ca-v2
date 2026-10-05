/**
 * Test coverage: Route tests for favourites API map configuration mutations, including create/delete behavior and persistence calls.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapConfigFavourite } from '$lib/db/db-types';

vi.mock('$lib/db/user', () => ({
  getUserData: vi.fn(),
  putUserData: vi.fn(),
}));

import { DELETE, PATCH, POST, PUT } from '../../routes/[lang]/api/favourites/+server';
import { getUserData, putUserData } from '$lib/db/user';

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
