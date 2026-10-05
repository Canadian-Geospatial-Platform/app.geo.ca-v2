/**
 * Test coverage: Unit tests for the environment-based Secure cookie policy.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isSecureCookieEnvironment } from '$lib/utils/auth/cookie-policy.server';

describe('isSecureCookieEnvironment', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(isSecureCookieEnvironment()).toBe(true);
  });

  it('returns false outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');

    expect(isSecureCookieEnvironment()).toBe(false);
  });
});
