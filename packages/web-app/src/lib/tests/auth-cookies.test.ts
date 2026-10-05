/**
 * Test coverage: Unit tests for complete auth-flow cookie cleanup.
 */
import type { Cookies } from '@sveltejs/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clearSessionCookieMock } = vi.hoisted(() => ({
  clearSessionCookieMock: vi.fn(),
}));

vi.mock('$lib/utils/auth/session-cookie.server', () => ({
  clearSessionCookie: clearSessionCookieMock,
}));

import { clearAuthCookies } from '$lib/utils/auth/auth-cookies';

describe('clearAuthCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears the session and every temporary auth-flow cookie', () => {
    const deletedNames: string[] = [];
    const cookies = {
      delete: (name: string) => {
        deletedNames.push(name);
      },
    } as unknown as Cookies;

    clearAuthCookies(cookies);

    expect(clearSessionCookieMock).toHaveBeenCalledWith(cookies);
    expect(deletedNames).toEqual([
      'access_token',
      'id_token',
      'refresh_token',
      'pkce_verifier',
      'oidc_nonce',
      'oidc_state',
      'oidc_return_to',
      'auth_error',
      'post_logout_lang',
    ]);
  });
});
