/**
 * Test coverage: Route tests for the front-channel logout callback endpoint.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clearAuthCookiesMock } = vi.hoisted(() => ({
  clearAuthCookiesMock: vi.fn(),
}));

vi.mock('$lib/utils/auth/auth-cookies', () => ({
  clearAuthCookies: clearAuthCookiesMock,
}));

import { GET } from '../../routes/sign-in/front-channel-logout/+server';

describe('GET /sign-in/front-channel-logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 204 without redirecting even when redirect-like query parameters are present', async () => {
    const event = {
      cookies: {} as never,
      url: new URL('https://example.test/sign-in/front-channel-logout?sid=session-123&returnTo=https://malicious.example/phishing'),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(event);

    expect(response.status).toBe(204);
    expect(response.headers.get('location')).toBeNull();
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
  });

  it('returns 204 and clears auth cookies when sid is present', async () => {
    const event = {
      cookies: {} as never,
      url: new URL('https://example.test/sign-in/front-channel-logout?sid=session-123'),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(event);

    expect(response.status).toBe(204);
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
  });

  it('returns 204 and clears auth cookies when logout marker is present', async () => {
    const event = {
      cookies: {} as never,
      url: new URL('https://example.test/sign-in/front-channel-logout?logout=true'),
    } as unknown as Parameters<typeof GET>[0];

    const response = await GET(event);

    expect(response.status).toBe(204);
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
  });
});
