import { ensureTrailingSlashless } from '$lib/utils/auth/oidc.server';

export const OIDC_CLOCK_SKEW_SECONDS = 5 * 60;

/**
 * Normalizes an OIDC audience claim into a string array.
 *
 * @param aud - Raw audience claim value.
 * @returns Audience values filtered to strings.
 */
export function getAudienceValues(aud: unknown): string[] {
  return Array.isArray(aud)
    ? aud.filter((value): value is string => typeof value === 'string')
    : [aud].filter((value): value is string => typeof value === 'string');
}

/**
 * Checks whether a token issuer claim matches the expected issuer.
 *
 * @param iss - Raw issuer claim value.
 * @param expectedIssuer - Expected issuer URI without trailing slash.
 * @returns True when issuer exists and matches the expected issuer.
 */
export function issuerMatches(iss: unknown, expectedIssuer: string): iss is string {
  return typeof iss === 'string' && ensureTrailingSlashless(iss) === expectedIssuer;
}

/**
 * Validates that a token expiration claim is present and in the future.
 *
 * @param exp - Raw expiration claim value in epoch seconds.
 * @returns True when exp is numeric and not expired.
 */
export function hasValidExp(exp: unknown): exp is number {
  return typeof exp === 'number' && exp * 1000 > Date.now() - OIDC_CLOCK_SKEW_SECONDS * 1000;
}

/**
 * Validates that a token issued-at claim is present and numeric.
 *
 * @param iat - Raw issued-at claim value in epoch seconds.
 * @returns True when iat is numeric and not implausibly far in the future.
 */
export function hasNumericIat(iat: unknown): iat is number {
  return typeof iat === 'number' && iat * 1000 <= Date.now() + OIDC_CLOCK_SKEW_SECONDS * 1000;
}

/**
 * Validates that a token not-before claim is absent or within the allowed clock skew.
 *
 * @param nbf - Raw not-before claim value in epoch seconds.
 * @returns True when nbf is absent or not too far in the future.
 */
export function hasValidNbf(nbf: unknown): boolean {
  return typeof nbf === 'undefined' || (typeof nbf === 'number' && nbf * 1000 <= Date.now() + OIDC_CLOCK_SKEW_SECONDS * 1000);
}
