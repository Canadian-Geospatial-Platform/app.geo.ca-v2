/**
 * Test coverage: Integration-style route tests for the back-channel logout endpoint, including token validation outcomes and HTTP response behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { markUserAuthRevokedMock, verifyBackChannelLogoutTokenMock } = vi.hoisted(() => ({
  markUserAuthRevokedMock: vi.fn(),
  verifyBackChannelLogoutTokenMock: vi.fn(),
}));

vi.mock('$lib/db/user', () => ({
  markUserAuthRevoked: markUserAuthRevokedMock,
}));

vi.mock('$lib/utils/auth/sign-in-back-channel.server', () => ({
  verifyBackChannelLogoutToken: verifyBackChannelLogoutTokenMock,
}));

import { POST } from '../../routes/sign-in/back-channel-logout/+server';

describe('POST /sign-in/back-channel-logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when logout_token is missing', async () => {
    const request = new Request('https://example.test/sign-in/back-channel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Missing logout_token');
  });

  it('returns 400 when verification fails', async () => {
    verifyBackChannelLogoutTokenMock.mockResolvedValue(null);

    const request = new Request('https://example.test/sign-in/back-channel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ logout_token: 'jwt-value' }),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(400);
    expect(await response.text()).toBe('Invalid logout_token');
  });

  it('returns 204 for replayed logout tokens (idempotent)', async () => {
    verifyBackChannelLogoutTokenMock.mockResolvedValue({
      sub: 'user-123',
      iat: 1700000000,
      jti: 'logout-jti-1',
    });
    markUserAuthRevokedMock.mockResolvedValue('replayed');

    const request = new Request('https://example.test/sign-in/back-channel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ logout_token: 'jwt-value' }),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(204);
    expect(markUserAuthRevokedMock).toHaveBeenCalledWith('user-123', 1700000000, 'logout-jti-1');
  });

  it('returns 500 when revocation persistence fails', async () => {
    verifyBackChannelLogoutTokenMock.mockResolvedValue({
      sub: 'user-123',
      iat: 1700000000,
      jti: 'logout-jti-1',
    });
    markUserAuthRevokedMock.mockResolvedValue('error');

    const request = new Request('https://example.test/sign-in/back-channel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ logout_token: 'jwt-value' }),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('Unable to revoke session');
  });

  it('returns 204 when revocation marker is stored', async () => {
    verifyBackChannelLogoutTokenMock.mockResolvedValue({
      sub: 'user-123',
      iat: 1700000000,
      jti: 'logout-jti-1',
    });
    markUserAuthRevokedMock.mockResolvedValue('stored');

    const request = new Request('https://example.test/sign-in/back-channel-logout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ logout_token: 'jwt-value' }),
    });

    const response = await POST({ request } as Parameters<typeof POST>[0]);

    expect(response.status).toBe(204);
    expect(markUserAuthRevokedMock).toHaveBeenCalledWith('user-123', 1700000000, 'logout-jti-1');
  });
});
