/**
 * Test coverage: Unit tests for the individual OIDC claim validators used by ID token and back-channel logout verification.
 */
import { describe, expect, it } from 'vitest';
import {
  getAudienceValues,
  hasNumericIat,
  hasValidExp,
  hasValidNbf,
  issuerMatches,
  OIDC_CLOCK_SKEW_SECONDS,
} from '$lib/utils/auth/oidc-claims.server';

describe('getAudienceValues', () => {
  it('wraps a single string audience in an array', () => {
    expect(getAudienceValues('client-123')).toEqual(['client-123']);
  });

  it('filters an array audience down to string values', () => {
    expect(getAudienceValues(['client-123', 42, null, 'client-456'])).toEqual(['client-123', 'client-456']);
  });

  it('returns an empty array for non-string, non-array values', () => {
    expect(getAudienceValues(42)).toEqual([]);
    expect(getAudienceValues(undefined)).toEqual([]);
    expect(getAudienceValues(null)).toEqual([]);
  });
});

describe('issuerMatches', () => {
  it('matches when the issuer equals the expected issuer', () => {
    expect(issuerMatches('https://auth.example.test', 'https://auth.example.test')).toBe(true);
  });

  it('normalizes a trailing slash on the token issuer before comparing', () => {
    expect(issuerMatches('https://auth.example.test/', 'https://auth.example.test')).toBe(true);
  });

  it('rejects a mismatched issuer', () => {
    expect(issuerMatches('https://evil.example', 'https://auth.example.test')).toBe(false);
  });

  it('rejects a non-string issuer claim', () => {
    expect(issuerMatches(undefined, 'https://auth.example.test')).toBe(false);
    expect(issuerMatches(123, 'https://auth.example.test')).toBe(false);
  });
});

describe('hasValidExp', () => {
  it('accepts a future expiration', () => {
    expect(hasValidExp(Math.floor(Date.now() / 1000) + 3600)).toBe(true);
  });

  it('accepts an expiration just within the clock skew window', () => {
    const withinSkew = Math.floor(Date.now() / 1000) - OIDC_CLOCK_SKEW_SECONDS + 30;
    expect(hasValidExp(withinSkew)).toBe(true);
  });

  it('rejects an expiration beyond the clock skew window', () => {
    const beyondSkew = Math.floor(Date.now() / 1000) - OIDC_CLOCK_SKEW_SECONDS - 30;
    expect(hasValidExp(beyondSkew)).toBe(false);
  });

  it('rejects a non-numeric exp', () => {
    expect(hasValidExp(undefined)).toBe(false);
    expect(hasValidExp('123')).toBe(false);
  });
});

describe('hasNumericIat', () => {
  it('accepts a past issued-at time', () => {
    expect(hasNumericIat(Math.floor(Date.now() / 1000) - 60)).toBe(true);
  });

  it('accepts an issued-at time just within the clock skew window', () => {
    const withinSkew = Math.floor(Date.now() / 1000) + OIDC_CLOCK_SKEW_SECONDS - 30;
    expect(hasNumericIat(withinSkew)).toBe(true);
  });

  it('rejects an issued-at time implausibly far in the future', () => {
    const beyondSkew = Math.floor(Date.now() / 1000) + OIDC_CLOCK_SKEW_SECONDS + 30;
    expect(hasNumericIat(beyondSkew)).toBe(false);
  });

  it('rejects a non-numeric iat', () => {
    expect(hasNumericIat(undefined)).toBe(false);
    expect(hasNumericIat('123')).toBe(false);
  });
});

describe('hasValidNbf', () => {
  it('accepts a missing nbf claim', () => {
    expect(hasValidNbf(undefined)).toBe(true);
  });

  it('accepts an nbf within the clock skew window', () => {
    const withinSkew = Math.floor(Date.now() / 1000) + OIDC_CLOCK_SKEW_SECONDS - 30;
    expect(hasValidNbf(withinSkew)).toBe(true);
  });

  it('rejects an nbf implausibly far in the future', () => {
    const beyondSkew = Math.floor(Date.now() / 1000) + OIDC_CLOCK_SKEW_SECONDS + 30;
    expect(hasValidNbf(beyondSkew)).toBe(false);
  });

  it('rejects a non-numeric nbf', () => {
    expect(hasValidNbf('123')).toBe(false);
  });
});
