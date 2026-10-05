/**
 * Test coverage: Unit tests for auth cookie token parsing, including valid token handling and stale-cookie cleanup behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { verifyIdTokenMock, clearAuthCookiesMock } = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  clearAuthCookiesMock: vi.fn(),
}));

vi.mock('$lib/utils/auth/id-token.server', () => ({
  verifyIdToken: verifyIdTokenMock,
}));

vi.mock('$lib/utils/auth/auth-cookies', () => ({
  clearAuthCookies: clearAuthCookiesMock,
}));

import { getToken } from '$lib/utils/auth/parse-jwt';

/**
 * Creates a minimal cookies test double that supports read access by key.
 *
 * @param values - Cookie name/value map.
 * @returns Cookies-like object exposing get(name).
 */
function makeCookies(values: Record<string, string | undefined>) {
  return {
    get: (name: string) => values[name],
  } as never;
}

describe('getToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok when id_token verifies successfully', async () => {
    const payload = { sub: 'user-123', iat: 1700000000 };
    verifyIdTokenMock.mockResolvedValueOnce(payload);

    const result = await getToken(makeCookies({ id_token: 'valid.jwt.token' }));

    expect(result).toEqual({ ok: true, value: payload });
    expect(clearAuthCookiesMock).not.toHaveBeenCalled();
  });

  it('returns anonymous and does NOT clear cookies when no auth cookies are present', async () => {
    const result = await getToken(makeCookies({}));

    expect(result).toEqual({ ok: false });
    expect(clearAuthCookiesMock).not.toHaveBeenCalled();
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it('clears stale refresh_token when id_token is absent', async () => {
    const result = await getToken(makeCookies({ refresh_token: 'stale-refresh' }));

    expect(result).toEqual({ ok: false, staleCleared: true });
    expect(clearAuthCookiesMock).toHaveBeenCalledOnce();
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it('clears stale access_token when id_token is absent', async () => {
    const result = await getToken(makeCookies({ access_token: 'stale-access' }));

    expect(result).toEqual({ ok: false, staleCleared: true });
    expect(clearAuthCookiesMock).toHaveBeenCalledOnce();
  });

  it('clears all auth cookies when id_token fails verification', async () => {
    verifyIdTokenMock.mockResolvedValueOnce(null);

    const result = await getToken(makeCookies({ id_token: 'bad.jwt.token', refresh_token: 'stale-refresh' }));

    expect(result).toEqual({ ok: false, staleCleared: true });
    expect(clearAuthCookiesMock).toHaveBeenCalledOnce();
  });

  it('clears all auth cookies when id_token has no sub or username', async () => {
    verifyIdTokenMock.mockResolvedValueOnce({ iat: 1700000000 }); // payload missing sub/username

    const result = await getToken(makeCookies({ id_token: 'partial.jwt.token' }));

    expect(result).toEqual({ ok: false, staleCleared: true });
    expect(clearAuthCookiesMock).toHaveBeenCalledOnce();
  });
});
