/**
 * Test coverage: credentialed CORS and session validation for the static-site auth status endpoint.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUserDataMock } = vi.hoisted(() => ({
  getUserDataMock: vi.fn(),
}));

vi.mock('#lib/db/user.js', () => ({
  getUserData: getUserDataMock,
}));

vi.mock('$app/env/private', () => ({
  AUTH_STATUS_ALLOWED_ORIGINS: 'https://geo.ca,https://www.geo.ca',
}));

import { GET, OPTIONS } from '../../routes/api/auth-status/+server';

describe('/api/auth-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only signed-in status and permits credentialed requests from an allowed origin', async () => {
    getUserDataMock.mockResolvedValue({
      Item: { uuid: 'user-123', favourites: [], mapConfigs: [] },
      status: 'ok',
    });

    const response = await GET({
      cookies: {},
      request: new Request('https://app.geo.ca/api/auth-status', {
        headers: { Origin: 'https://geo.ca' },
      }),
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: true });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://geo.ca');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns signedIn false when the request is unauthenticated', async () => {
    getUserDataMock.mockResolvedValue({
      Item: { uuid: null, favourites: [], mapConfigs: [] },
      status: 'anonymous',
    });

    const response = await GET({
      cookies: {},
      request: new Request('https://app.geo.ca/api/auth-status', {
        headers: { Origin: 'https://geo.ca' },
      }),
    } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: false });
  });

  it('does not expose status to an unconfigured origin', async () => {
    const response = await GET({
      cookies: {},
      request: new Request('https://app.geo.ca/api/auth-status', {
        headers: { Origin: 'https://attacker.example' },
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(getUserDataMock).not.toHaveBeenCalled();
  });

  it('reports authentication status as unavailable when user data cannot be checked', async () => {
    getUserDataMock.mockResolvedValue({
      Item: { uuid: 'user-123', favourites: [], mapConfigs: [] },
      status: 'unavailable',
    });

    const response = await GET({
      cookies: {},
      request: new Request('https://app.geo.ca/api/auth-status', {
        headers: { Origin: 'https://geo.ca' },
      }),
    } as never);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Authentication status unavailable' });
  });

  it('accepts preflight only from a configured origin', async () => {
    const response = await OPTIONS({
      request: new Request('https://app.geo.ca/api/auth-status', {
        method: 'OPTIONS',
        headers: { Origin: 'https://geo.ca' },
      }),
    } as never);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('rejects preflight from an unconfigured origin', async () => {
    const response = await OPTIONS({
      request: new Request('https://app.geo.ca/api/auth-status', {
        method: 'OPTIONS',
        headers: { Origin: 'https://attacker.example' },
      }),
    } as never);

    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
