/**
 * Test coverage: Session status and refresh route behavior used by the inactivity warning.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { exchangeRefreshTokenMock, getPrivateKeyMaterialMock, getTokenMock, setAuthCookiesMock, touchSessionCookieMock, verifyIdTokenMock } =
  vi.hoisted(() => ({
    exchangeRefreshTokenMock: vi.fn(),
    getPrivateKeyMaterialMock: vi.fn(),
    getTokenMock: vi.fn(),
    setAuthCookiesMock: vi.fn(),
    touchSessionCookieMock: vi.fn(),
    verifyIdTokenMock: vi.fn(),
  }));

vi.mock('$lib/utils/auth/parse-jwt', () => ({
  getToken: getTokenMock,
}));

vi.mock('$lib/utils/auth/oidc.server', () => ({
  getPrivateKeyMaterial: getPrivateKeyMaterialMock,
}));

vi.mock('$lib/utils/auth/sign-in-core.server', () => ({
  exchangeRefreshToken: exchangeRefreshTokenMock,
  setAuthCookies: setAuthCookiesMock,
}));

vi.mock('$lib/utils/auth/id-token.server', () => ({
  verifyIdToken: verifyIdTokenMock,
}));

vi.mock('$lib/utils/auth/session-cookie.server', () => ({
  touchSessionCookie: touchSessionCookieMock,
}));

import { GET, POST } from '../../routes/api/session/+server';

type CookieHarness = {
  cookies: {
    get: (name: string) => string | undefined;
  };
};

function createCookies(refreshToken?: string): CookieHarness['cookies'] {
  return {
    get: (name: string) => (name === 'refresh_token' ? refreshToken : undefined),
  };
}

describe('/api/session GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    touchSessionCookieMock.mockReturnValue(true);
  });

  it('returns 401 when the current token is unavailable', async () => {
    getTokenMock.mockResolvedValue({ ok: false });

    const response = await GET({ cookies: createCookies() } as never);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ signedIn: false });
    expect(touchSessionCookieMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the token has no expiry or user identity', async () => {
    getTokenMock.mockResolvedValue({ ok: true, value: { exp: 1_700_000_000 } });

    const response = await GET({ cookies: createCookies() } as never);

    expect(response.status).toBe(401);
    expect(touchSessionCookieMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the server-owned session cannot be touched', async () => {
    getTokenMock.mockResolvedValue({
      ok: true,
      value: { exp: 1_700_000_000, sub: 'user-123', sid: 'sid-123' },
    });
    touchSessionCookieMock.mockReturnValue(false);

    const response = await GET({ cookies: createCookies() } as never);

    expect(response.status).toBe(401);
    expect(touchSessionCookieMock).toHaveBeenCalledWith(expect.anything(), 'user-123', 'sid-123');
  });

  it('returns the verified expiry for a valid session', async () => {
    getTokenMock.mockResolvedValue({
      ok: true,
      value: { exp: 1_700_000_000, username: 'user-123' },
    });

    const response = await GET({ cookies: createCookies() } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: true, expiresAt: 1_700_000_000_000 });
    expect(touchSessionCookieMock).toHaveBeenCalledWith(expect.anything(), 'user-123', null);
  });
});

describe('/api/session POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getPrivateKeyMaterialMock.mockResolvedValue(null);
    exchangeRefreshTokenMock.mockResolvedValue({
      id_token: 'new-id-token',
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    });
    verifyIdTokenMock.mockResolvedValue({ sub: 'user-123', sid: 'sid-123' });
    touchSessionCookieMock.mockReturnValue(true);
    setAuthCookiesMock.mockReturnValue(true);
    getTokenMock.mockResolvedValue({ ok: true, value: { exp: 1_700_000_100 } });
  });

  it('returns 401 when no refresh token is available', async () => {
    const response = await POST({ cookies: createCookies() } as never);

    expect(response.status).toBe(401);
    expect(exchangeRefreshTokenMock).not.toHaveBeenCalled();
  });

  it('returns 401 when refresh exchange fails', async () => {
    exchangeRefreshTokenMock.mockResolvedValue(null);

    const response = await POST({ cookies: createCookies('refresh-token') } as never);

    expect(response.status).toBe(401);
    expect(verifyIdTokenMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the refreshed ID token is invalid', async () => {
    verifyIdTokenMock.mockResolvedValue(null);

    const response = await POST({ cookies: createCookies('refresh-token') } as never);

    expect(response.status).toBe(401);
    expect(setAuthCookiesMock).not.toHaveBeenCalled();
  });

  it('returns 401 when the server-owned session cannot be touched', async () => {
    touchSessionCookieMock.mockReturnValue(false);

    const response = await POST({ cookies: createCookies('refresh-token') } as never);

    expect(response.status).toBe(401);
    expect(setAuthCookiesMock).not.toHaveBeenCalled();
  });

  it('returns 401 when refreshed auth cookies cannot be stored', async () => {
    setAuthCookiesMock.mockReturnValue(false);

    const response = await POST({ cookies: createCookies('refresh-token') } as never);

    expect(response.status).toBe(401);
    expect(getTokenMock).not.toHaveBeenCalled();
  });

  it('refreshes the session and returns the new expiry', async () => {
    const cookies = createCookies('refresh-token');

    const response = await POST({ cookies } as never);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ signedIn: true, expiresAt: 1_700_000_100_000 });
    expect(exchangeRefreshTokenMock).toHaveBeenCalledWith('refresh-token', null, null);
    expect(verifyIdTokenMock).toHaveBeenCalledWith('new-id-token');
    expect(setAuthCookiesMock).toHaveBeenCalledWith(cookies, expect.objectContaining({ id_token: 'new-id-token' }));
  });
});
