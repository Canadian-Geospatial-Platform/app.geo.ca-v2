import { env } from '$env/dynamic/private';
import type { TokenPayload } from '$lib/db/db-types';

/**
 * Supported OIDC scopes that this relying party can safely request and validate.
 */
export const SUPPORTED_REQUESTED_SCOPES = ['openid', 'profile', 'email', 'language'] as const;

/**
 * Supported scope name derived from the allowlist above.
 */
export type RequestedScope = (typeof SUPPORTED_REQUESTED_SCOPES)[number];

const SUPPORTED_SCOPE_SET = new Set<string>(SUPPORTED_REQUESTED_SCOPES);

type ScopedClaimType = 'string' | 'boolean' | 'number';

type ScopedClaimRule = {
  claim: string;
  expectedType: ScopedClaimType;
};

const SCOPED_CLAIM_RULES: Partial<Record<RequestedScope, readonly ScopedClaimRule[]>> = {
  email: [
    { claim: 'email', expectedType: 'string' },
    { claim: 'email_verified', expectedType: 'boolean' },
  ],
  language: [
    { claim: 'locale', expectedType: 'string' },
    { claim: 'lang', expectedType: 'string' },
  ],
  profile: [
    { claim: 'name', expectedType: 'string' },
    { claim: 'given_name', expectedType: 'string' },
    { claim: 'family_name', expectedType: 'string' },
    { claim: 'middle_name', expectedType: 'string' },
    { claim: 'nickname', expectedType: 'string' },
    { claim: 'preferred_username', expectedType: 'string' },
    { claim: 'profile', expectedType: 'string' },
    { claim: 'zoneinfo', expectedType: 'string' },
    { claim: 'locale', expectedType: 'string' },
    { claim: 'updated_at', expectedType: 'number' },
  ],
};

/**
 * Parses a configured OIDC scope string into validated, deduplicated scopes.
 *
 * Supports comma- or whitespace-separated values and always ensures `openid` is included.
 * Unknown scopes are ignored.
 *
 * @param rawScopes - Raw scope string from configuration.
 * @returns Ordered list of supported requested scopes.
 */
export function parseRequestedScopes(rawScopes: string | null | undefined): RequestedScope[] {
  const values = (rawScopes ?? '')
    .split(/[\s,]+/)
    .map((scope) => scope.trim().toLowerCase())
    .filter((scope) => scope.length > 0);

  const deduped: RequestedScope[] = [];
  const seen = new Set<string>();

  for (const scope of values) {
    if (!SUPPORTED_SCOPE_SET.has(scope) || seen.has(scope)) {
      continue;
    }

    seen.add(scope);
    deduped.push(scope as RequestedScope);
  }

  if (!seen.has('openid')) {
    deduped.unshift('openid');
  }

  return deduped.length > 0 ? deduped : ['openid'];
}

/**
 * Reads requested OIDC scopes from environment configuration.
 *
 * `OIDC_REQUESTED_SCOPES` accepts comma- or space-delimited values.
 *
 * @returns Requested scopes with `openid` guaranteed.
 */
export function getRequestedScopes(): RequestedScope[] {
  return parseRequestedScopes(env.OIDC_REQUESTED_SCOPES ?? process.env.OIDC_REQUESTED_SCOPES ?? 'openid');
}

/**
 * Builds the OAuth authorize scope parameter value.
 *
 * @returns Space-delimited scope string.
 */
export function getAuthorizeScopeValue(): string {
  return getRequestedScopes().join(' ');
}

/**
 * Result of validating optional ID token claims associated with requested scopes.
 */
export type ScopedClaimValidationResult =
  | { ok: true }
  | {
      ok: false;
      scope: RequestedScope;
      invalidClaim: string;
      expectedType: string;
      actualType: string;
    };

/**
 * Converts a runtime value into a readable type label for diagnostics.
 *
 * @param value - Runtime value being inspected.
 * @returns Human-readable type name.
 */
function getValueType(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  return typeof value;
}

/**
 * Validates a single optional claim when the containing scope has been requested.
 *
 * Missing claims are accepted because some providers may return scoped data only
 * from UserInfo rather than in the ID token.
 *
 * @param payload - Decoded ID token payload.
 * @param scope - Scope associated with the claim.
 * @param claim - Claim name to inspect.
 * @param expectedType - Required runtime type when the claim is present.
 * @returns Claim validation result.
 */
function validateType(
  payload: TokenPayload,
  scope: RequestedScope,
  claim: string,
  expectedType: ScopedClaimType
): ScopedClaimValidationResult {
  const value = payload[claim];
  if (typeof value === 'undefined') {
    return { ok: true };
  }

  if (typeof value !== expectedType) {
    return {
      ok: false,
      scope,
      invalidClaim: claim,
      expectedType,
      actualType: getValueType(value),
    };
  }

  return { ok: true };
}

/**
 * Validates claim shapes based on configured requested scopes.
 *
 * This policy only validates claim types when claims are present. It does not require
 * optional scope claims to exist in the ID token, since providers may return those via UserInfo.
 *
 * @param payload - Decoded ID token payload.
 * @param requestedScopes - Requested scopes for this RP.
 * @returns Validation result describing the first scope claim mismatch, if any.
 */
export function validateScopedIdTokenClaims(payload: TokenPayload, requestedScopes: RequestedScope[]): ScopedClaimValidationResult {
  for (const scope of requestedScopes) {
    const claimRules = SCOPED_CLAIM_RULES[scope];
    if (!claimRules) {
      continue;
    }

    for (const { claim, expectedType } of claimRules) {
      const claimCheck = validateType(payload, scope, claim, expectedType);
      if (!claimCheck.ok) {
        return claimCheck;
      }
    }
  }

  return { ok: true };
}
