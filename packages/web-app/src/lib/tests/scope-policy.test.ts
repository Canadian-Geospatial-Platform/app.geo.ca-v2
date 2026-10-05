/**
 * Test coverage: Unit tests for scope policy helpers that derive/normalize requested OIDC scopes.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAuthorizeScopeValue,
  getRequestedScopes,
  parseRequestedScopes,
  validateScopedIdTokenClaims,
} from '$lib/utils/auth/scope-policy.server';

describe('scope-policy', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to openid when config is missing', () => {
    expect(parseRequestedScopes(undefined)).toEqual(['openid']);
  });

  it('deduplicates and normalizes supported scopes', () => {
    expect(parseRequestedScopes('EMAIL profile,openid email unknown')).toEqual(['email', 'profile', 'openid']);
  });

  it('injects openid when omitted', () => {
    expect(parseRequestedScopes('email language')).toEqual(['openid', 'email', 'language']);
  });

  it('reads configured scope env and builds authorize scope value', () => {
    vi.stubEnv('OIDC_REQUESTED_SCOPES', 'openid email language');

    expect(getRequestedScopes()).toEqual(['openid', 'email', 'language']);
    expect(getAuthorizeScopeValue()).toBe('openid email language');
  });

  it('accepts token payload when scoped claims are absent', () => {
    const result = validateScopedIdTokenClaims({ sub: 'user-123' }, ['openid', 'email', 'language', 'profile']);

    expect(result).toEqual({ ok: true });
  });

  it('rejects malformed scoped claims when present', () => {
    const result = validateScopedIdTokenClaims(
      {
        sub: 'user-123',
        email: 12345,
      },
      ['openid', 'email']
    );

    expect(result).toMatchObject({
      ok: false,
      scope: 'email',
      invalidClaim: 'email',
      expectedType: 'string',
      actualType: 'number',
    });
  });
});
