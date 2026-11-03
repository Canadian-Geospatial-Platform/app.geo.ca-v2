import type { RequestHandler } from './$types';
import { getUserData, putUserData } from '#lib/db/user.js';
import type { MapConfigFavourite, UserData } from '#lib/db/db-types.js';
import { sanitizeMapConfigForStorage } from '#lib/utils/map-config-sanitizer.js';
import type { Cookies } from '@sveltejs/kit';

const MAX_SAVED_MAPS = 25;
const MAX_ITEM_SIZE_BYTES = 300000; // 300KB (conservative safety margin below 400KB DynamoDB limit)
const MAX_MAP_NAME_LENGTH = 120;
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Normalizes a candidate favourite id from request payload.
 *
 * @param value - Unknown JSON field value.
 * @returns Trimmed id string or an empty string when invalid.
 */
function sanitizeId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Normalizes a map name value from request payload.
 *
 * Trims whitespace and caps the value to the storage-safe max length.
 *
 * @param value - Unknown JSON field value.
 * @returns Sanitized map name or an empty string when invalid.
 */
function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, MAX_MAP_NAME_LENGTH);
}

/**
 * Returns true when a payload looks like a serializable config object.
 *
 * @param value - Candidate payload value.
 * @returns True when value is a non-null plain object candidate.
 */
function isValidMapConfig(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Detects unsafe object keys anywhere in a JSON-like object graph.
 *
 * @param value - Candidate object graph to inspect.
 * @returns True when unsafe keys are detected at any depth.
 */
function hasUnsafeObjectKeys(value: unknown): boolean {
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!isValidMapConfig(current)) {
      continue;
    }

    for (const [key, child] of Object.entries(current)) {
      if (UNSAFE_OBJECT_KEYS.has(key)) {
        return true;
      }

      if (typeof child === 'object' && child !== null) {
        stack.push(child);
      }
    }
  }

  return false;
}

/**
 * Sanitizes and validates uploaded map config payload.
 *
 * Applies storage sanitizer, enforces required map structure, and rejects
 * unsafe object keys.
 *
 * @param value - Raw uploaded map config payload.
 * @returns Sanitized config object or null when invalid.
 */
function sanitizeUploadedMapConfig(value: unknown): Record<string, unknown> | null {
  if (!isValidMapConfig(value)) {
    return null;
  }

  const sanitized = sanitizeMapConfigForStorage(value);
  if (!isValidMapConfig(sanitized)) {
    return null;
  }

  if (!isValidMapConfig(sanitized.map)) {
    return null;
  }

  if (hasUnsafeObjectKeys(sanitized)) {
    return null;
  }

  return sanitized;
}

/**
 * Generates a unique map name based on existing saved map names.
 *
 * @param baseName - Requested base name.
 * @param existingMaps - Existing saved maps used for collision checks.
 * @returns Unique map name.
 */
function createUniqueMapName(baseName: string, existingMaps: MapConfigFavourite[]): string {
  const normalizedBase = baseName || 'My Map';
  const existingNames = new Set(existingMaps.map((mapItem) => mapItem.name));

  if (!existingNames.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;
  let candidate = `${normalizedBase} ${suffix}`;
  while (existingNames.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase} ${suffix}`;
  }

  return candidate;
}

type MapConfigMutationPayload = {
  action?: 'createMapConfig' | 'updateMapConfig' | 'deleteMapConfig';
  id?: string;
  name?: string;
  config?: unknown;
};

/** Validates, builds, and persists a saved-map create or update request. */
async function saveMapConfig(payload: MapConfigMutationPayload, userData: UserData, cookies: Cookies): Promise<Response> {
  const mapConfigs = userData.mapConfigs ?? [];
  const updating = payload.action === 'updateMapConfig';
  const id = sanitizeId(payload.id);

  if (updating && !id) {
    return Response.json({ ok: false, mapConfigs, reason: 'invalid-id' }, { status: 400 });
  }
  if (updating && !mapConfigs.some((mapItem) => mapItem.id === id)) {
    return Response.json({ ok: false, mapConfigs, reason: 'not-found' }, { status: 404 });
  }
  if (!updating && mapConfigs.length >= MAX_SAVED_MAPS) {
    return Response.json({ ok: false, mapConfigs, reason: 'limit' }, { status: 400 });
  }

  const sanitizedConfig = sanitizeUploadedMapConfig(payload.config);
  if (!sanitizedConfig) {
    return Response.json({ ok: false, mapConfigs, reason: 'invalid-config' }, { status: 400 });
  }

  const nextMapConfigs: MapConfigFavourite[] = updating
    ? mapConfigs.map((mapItem) => (mapItem.id === id ? { ...mapItem, config: sanitizedConfig } : mapItem))
    : [
        ...mapConfigs,
        {
          id: crypto.randomUUID(),
          name: createUniqueMapName(sanitizeName(payload.name) || 'My Map', mapConfigs),
          config: sanitizedConfig,
          createdAt: new Date().toISOString(),
        },
      ];
  const nextUserData = { ...userData, mapConfigs: nextMapConfigs, favourites: userData.favourites ?? [] };

  // Map configs share the DynamoDB item with favourites and auth metadata, so measure the full row.
  const estimatedSize = new TextEncoder().encode(JSON.stringify(nextUserData)).byteLength;
  if (estimatedSize > MAX_ITEM_SIZE_BYTES) {
    return Response.json({ ok: false, mapConfigs, reason: 'item-too-large' }, { status: 400 });
  }

  const result = await putUserData(nextUserData, cookies);
  if (!result.ok) {
    console.error('Failed to persist map config.', { action: payload.action, mapCount: nextMapConfigs.length });
    return Response.json({ ok: false, mapConfigs, reason: 'persist-failed' }, { status: 500 });
  }

  return Response.json({ ok: true, mapConfigs: nextMapConfigs, mapConfigId: updating ? id : nextMapConfigs[mapConfigs.length].id });
}

/** Deletes a saved map while preserving the user's datasets and other profile data. */
async function deleteMapConfig(idValue: unknown, userData: UserData, cookies: Cookies): Promise<Response> {
  const mapConfigs = userData.mapConfigs ?? [];
  const id = sanitizeId(idValue);
  if (!id) {
    return Response.json({ ok: false, mapConfigs, reason: 'invalid-id' }, { status: 400 });
  }

  const nextUserData = {
    ...userData,
    mapConfigs: mapConfigs.filter((mapItem) => mapItem.id !== id),
    favourites: userData.favourites ?? [],
  };
  const result = await putUserData(nextUserData, cookies);
  if (!result.ok) {
    return Response.json({ ok: false, mapConfigs, reason: 'persist-failed' }, { status: 500 });
  }

  return Response.json({ ok: true, mapConfigs: nextUserData.mapConfigs });
}

/**
 * Adds a record id to the signed-in user's favourites.
 *
 * @param cookies - SvelteKit cookie jar from the request context.
 * @param request - Incoming request containing the JSON payload.
 * @returns JSON response with updated favourites state.
 */
export const POST: RequestHandler = async ({ cookies, request }): Promise<Response> => {
  const userData = await getUserData(cookies);
  if (!userData.Item.uuid) {
    return Response.json({ ok: false, favourites: [] }, { status: 401 });
  }

  const payload = (await request.json()) as { id?: string };
  const id = sanitizeId(payload.id);
  if (!id) {
    return Response.json({ ok: false, favourites: userData.Item.favourites }, { status: 400 });
  }

  userData.Item.favourites = Array.from(new Set([...(userData.Item.favourites ?? []), id]));
  userData.Item.mapConfigs = userData.Item.mapConfigs ?? [];
  const result = await putUserData(userData.Item, cookies);
  return Response.json({ ok: result.ok, favourites: userData.Item.favourites });
};

/**
 * Removes a record id from the signed-in user's favourites.
 *
 * @param cookies - SvelteKit cookie jar from the request context.
 * @param request - Incoming request containing the JSON payload.
 * @returns JSON response with updated favourites state.
 */
export const DELETE: RequestHandler = async ({ cookies, request }): Promise<Response> => {
  const userData = await getUserData(cookies);
  if (!userData.Item.uuid) {
    return Response.json({ ok: false, favourites: [] }, { status: 401 });
  }

  const payload = (await request.json()) as { id?: string };
  const id = sanitizeId(payload.id);
  if (!id) {
    return Response.json({ ok: false, favourites: userData.Item.favourites }, { status: 400 });
  }

  userData.Item.favourites = (userData.Item.favourites ?? []).filter((favourite: string) => favourite !== id);
  userData.Item.mapConfigs = userData.Item.mapConfigs ?? [];
  const result = await putUserData(userData.Item, cookies);
  return Response.json({ ok: result.ok, favourites: userData.Item.favourites });
};

/**
 * Clears all favourites for the signed-in user.
 *
 * @param cookies - SvelteKit cookie jar from the request context.
 * @returns JSON response with emptied favourites state.
 */
export const PUT: RequestHandler = async ({ cookies }): Promise<Response> => {
  const userData = await getUserData(cookies);
  if (!userData.Item.uuid) {
    return Response.json({ ok: false, favourites: [] }, { status: 401 });
  }

  userData.Item.favourites = [];
  userData.Item.mapConfigs = userData.Item.mapConfigs ?? [];
  const result = await putUserData(userData.Item, cookies);
  return Response.json({ ok: result.ok, favourites: [] });
};

/**
 * Mutates saved map configs for the signed-in user.
 *
 * Supports create, update and delete actions for saved map configurations.
 *
 * @param cookies - SvelteKit cookie jar from the request context.
 * @param request - Incoming request containing the JSON payload.
 * @returns JSON response with updated map config state.
 */
export const PATCH: RequestHandler = async ({ cookies, request }): Promise<Response> => {
  const userData = await getUserData(cookies);
  if (!userData.Item.uuid) {
    return Response.json({ ok: false, mapConfigs: [] }, { status: 401 });
  }

  if (userData.status === 'unavailable') {
    return Response.json({ ok: false, reason: 'unavailable' }, { status: 503 });
  }

  const payload = (await request.json()) as MapConfigMutationPayload;
  const mapConfigs = userData.Item.mapConfigs ?? [];

  if (payload.action === 'createMapConfig' || payload.action === 'updateMapConfig') {
    return saveMapConfig(payload, userData.Item, cookies);
  }

  if (payload.action === 'deleteMapConfig') {
    return deleteMapConfig(payload.id, userData.Item, cookies);
  }

  return Response.json({ ok: false, mapConfigs, reason: 'invalid-action' }, { status: 400 });
};
