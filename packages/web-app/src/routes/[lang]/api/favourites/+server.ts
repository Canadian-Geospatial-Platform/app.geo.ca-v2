import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getUserData, putUserData } from '$lib/db/user';
import type { MapConfigFavourite } from '$lib/db/db-types';
import { sanitizeMapConfigForStorage } from '$lib/utils/map-config-sanitizer';

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
    return json({ ok: false, favourites: [] }, { status: 401 });
  }

  const payload = (await request.json()) as { id?: string };
  const id = sanitizeId(payload.id);
  if (!id) {
    return json({ ok: false, favourites: userData.Item.favourites }, { status: 400 });
  }

  userData.Item.favourites = Array.from(new Set([...(userData.Item.favourites ?? []), id]));
  userData.Item.mapConfigs = userData.Item.mapConfigs ?? [];
  const result = await putUserData(userData.Item, cookies);
  return json({ ok: result.ok, favourites: userData.Item.favourites });
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
    return json({ ok: false, favourites: [] }, { status: 401 });
  }

  const payload = (await request.json()) as { id?: string };
  const id = sanitizeId(payload.id);
  if (!id) {
    return json({ ok: false, favourites: userData.Item.favourites }, { status: 400 });
  }

  userData.Item.favourites = (userData.Item.favourites ?? []).filter((favourite: string) => favourite !== id);
  userData.Item.mapConfigs = userData.Item.mapConfigs ?? [];
  const result = await putUserData(userData.Item, cookies);
  return json({ ok: result.ok, favourites: userData.Item.favourites });
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
    return json({ ok: false, favourites: [] }, { status: 401 });
  }

  userData.Item.favourites = [];
  userData.Item.mapConfigs = userData.Item.mapConfigs ?? [];
  const result = await putUserData(userData.Item, cookies);
  return json({ ok: result.ok, favourites: [] });
};

/**
 * Mutates saved map configs for the signed-in user.
 *
 * Supports create and delete actions for saved map configurations.
 *
 * @param cookies - SvelteKit cookie jar from the request context.
 * @param request - Incoming request containing the JSON payload.
 * @returns JSON response with updated map config state.
 */
export const PATCH: RequestHandler = async ({ cookies, request }): Promise<Response> => {
  const userData = await getUserData(cookies);
  if (!userData.Item.uuid) {
    return json({ ok: false, mapConfigs: [] }, { status: 401 });
  }

  const payload = (await request.json()) as {
    action?: 'createMapConfig' | 'deleteMapConfig';
    id?: string;
    name?: string;
    config?: unknown;
  };

  const mapConfigs = userData.Item.mapConfigs ?? [];

  if (payload.action === 'createMapConfig') {
    if (mapConfigs.length >= MAX_SAVED_MAPS) {
      return json({ ok: false, mapConfigs, reason: 'limit' }, { status: 400 });
    }

    const sanitizedConfig = sanitizeUploadedMapConfig(payload.config);
    if (!sanitizedConfig) {
      return json({ ok: false, mapConfigs, reason: 'invalid-config' }, { status: 400 });
    }

    const requestedName = sanitizeName(payload.name);
    const baseName = requestedName || 'My Map';
    const finalName = createUniqueMapName(baseName, mapConfigs);
    const createdAt = new Date().toISOString();

    const mapConfig: MapConfigFavourite = {
      id: crypto.randomUUID(),
      name: finalName,
      config: sanitizedConfig,
      createdAt,
    };

    // Check if adding this map would exceed DynamoDB item size limit.
    userData.Item.mapConfigs = [...mapConfigs, mapConfig];
    userData.Item.favourites = userData.Item.favourites ?? [];
    const estimatedSize = JSON.stringify(userData.Item).length;

    if (estimatedSize > MAX_ITEM_SIZE_BYTES) {
      // Restore original state before returning error.
      userData.Item.mapConfigs = mapConfigs;
      return json({ ok: false, mapConfigs, reason: 'item-too-large' }, { status: 400 });
    }

    const result = await putUserData(userData.Item, cookies);
    if (!result.ok) {
      console.error('Failed to persist map config. Current map count:', mapConfigs.length + 1);
      return json({ ok: false, mapConfigs, reason: 'persist-failed' }, { status: 500 });
    }

    return json({ ok: result.ok, mapConfigs: userData.Item.mapConfigs });
  }

  if (payload.action === 'deleteMapConfig') {
    const id = sanitizeId(payload.id);
    if (!id) {
      return json({ ok: false, mapConfigs, reason: 'invalid-id' }, { status: 400 });
    }

    userData.Item.mapConfigs = mapConfigs.filter((mapItem) => mapItem.id !== id);
    // Keep datasets list intact while mutating saved-map entries.
    userData.Item.favourites = userData.Item.favourites ?? [];

    const result = await putUserData(userData.Item, cookies);
    if (!result.ok) {
      return json({ ok: false, mapConfigs, reason: 'persist-failed' }, { status: 500 });
    }

    return json({ ok: result.ok, mapConfigs: userData.Item.mapConfigs });
  }

  return json({ ok: false, mapConfigs, reason: 'invalid-action' }, { status: 400 });
};
