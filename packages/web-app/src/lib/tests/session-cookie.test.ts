import type { Cookies } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SESSION_INACTIVITY_SECONDS } from '#lib/config/constants.js';
import {
  SESSION_MAXIMUM_SECONDS,
  createSessionCookie,
  touchSessionCookie,
} from '#lib/utils/auth/session-cookie.server.js';

function createCookies(): Cookies & {
  values: Map<string, string>;
  setOptions: Map<string, Record<string, unknown>>;
  deleteOptions: Map<string, Record<string, unknown>>;
} {
  const values = new Map<string, string>();
  const setOptions = new Map<string, Record<string, unknown>>();
  const deleteOptions = new Map<string, Record<string, unknown>>();
  return {
    values,
    setOptions,
    deleteOptions,
    get: (name: string) => values.get(name),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      values.set(name, value);
      if (options) setOptions.set(name, options);
    },
    delete: (name: string, options?: Record<string, unknown>) => {
      values.delete(name);
      if (options) deleteOptions.set(name, options);
    },
  } as unknown as Cookies & {
    values: Map<string, string>;
    setOptions: Map<string, Record<string, unknown>>;
    deleteOptions: Map<string, Record<string, unknown>>;
  };
}

describe('server-owned session cookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts a signed session touch within the configured limits', () => {
    vi.stubEnv('SESSION_COOKIE_SECRET', 'test-session-secret');
    const cookies = createCookies();
    createSessionCookie(cookies, 'user-123', 'sid-123', 1_000);

    expect(touchSessionCookie(cookies, 'user-123', 'sid-123', 1_000 + SESSION_INACTIVITY_SECONDS - 1)).toBe(true);
  });

  it('uses the configured parent domain for the session cookie and rejection cleanup', () => {
    vi.stubEnv('SESSION_COOKIE_SECRET', 'test-session-secret');
    vi.stubEnv('AUTH_COOKIE_DOMAIN', 'geo.ca');
    const cookies = createCookies();

    createSessionCookie(cookies, 'user-123', 'sid-123', 1_000);
    expect(cookies.setOptions.get('auth_session')).toMatchObject({ domain: 'geo.ca' });

    expect(touchSessionCookie(cookies, 'other-user', 'sid-123', 1_001)).toBe(false);
    expect(cookies.deleteOptions.get('auth_session')).toMatchObject({ path: '/', domain: 'geo.ca' });
  });

  it('rejects tampered, mismatched, idle, and overlong sessions', () => {
    vi.stubEnv('SESSION_COOKIE_SECRET', 'test-session-secret');
    const cookies = createCookies();
    createSessionCookie(cookies, 'user-123', 'sid-123', 1_000);

    const sessionCookie = cookies.values.get('auth_session') ?? '';
    cookies.values.set('auth_session', `${sessionCookie}tampered`);
    expect(touchSessionCookie(cookies, 'user-123', 'sid-123', 1_001)).toBe(false);

    createSessionCookie(cookies, 'user-123', 'sid-123', 1_000);
    expect(touchSessionCookie(cookies, 'other-user', 'sid-123', 1_001)).toBe(false);

    createSessionCookie(cookies, 'user-123', 'sid-123', 1_000);
    expect(touchSessionCookie(cookies, 'user-123', 'sid-123', 1_000 + SESSION_INACTIVITY_SECONDS + 1)).toBe(false);

    createSessionCookie(cookies, 'user-123', 'sid-123', 1_000);
    expect(touchSessionCookie(cookies, 'user-123', 'sid-123', 1_000 + SESSION_MAXIMUM_SECONDS + 1)).toBe(false);
  });
});
