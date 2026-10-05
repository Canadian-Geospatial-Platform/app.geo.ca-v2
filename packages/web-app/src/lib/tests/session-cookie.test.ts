import type { Cookies } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_INACTIVITY_SECONDS,
  SESSION_MAXIMUM_SECONDS,
  createSessionCookie,
  touchSessionCookie,
} from '$lib/utils/auth/session-cookie.server';

function createCookies(): Cookies & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    get: (name: string) => values.get(name),
    set: (name: string, value: string) => values.set(name, value),
    delete: (name: string) => values.delete(name),
  } as unknown as Cookies & { values: Map<string, string> };
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
