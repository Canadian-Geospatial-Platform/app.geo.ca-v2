/**
 * Test coverage: Unit tests for post-auth and post-logout redirect helpers used after sign-in/logout.
 */
import type { Cookies } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { completeLocalLogout, getPostAuthRedirect, getPostLogoutRedirectPath } from '$lib/utils/auth/sign-in-post-auth.server';

/**
 * Creates a minimal cookie jar test double that records deleted cookie names.
 *
 * @returns Cookie jar double and the list of names it has deleted so far.
 */
function createCookieHarness(): { cookies: Cookies; deletedNames: string[] } {
  const deletedNames: string[] = [];
  const cookies = {
    get: () => undefined,
    set: () => undefined,
    delete: (name: string) => {
      deletedNames.push(name);
    },
  } as unknown as Cookies;

  return { cookies, deletedNames };
}

describe('sign-in post-auth helpers', () => {
  it('falls back to map-browser when state points to another origin', () => {
    const redirectPath = getPostAuthRedirect(
      new URL('https://example.test/sign-in/receive'),
      'https://malicious.example/phishing',
      'en-ca'
    );

    expect(redirectPath).toBe('/en-ca/map-browser');
  });

  it('returns favourites path for safe language-scoped logout return target', () => {
    const redirectPath = getPostLogoutRedirectPath('en-ca', '/en-ca/favourites');
    expect(redirectPath).toBe('/en-ca/favourites');
  });

  it('falls back to map-browser when logout return target is outside allowed favourites path', () => {
    const redirectPath = getPostLogoutRedirectPath('en-ca', '/en-ca/favourites/datasets');
    expect(redirectPath).toBe('/en-ca/map-browser');
  });
});

describe('completeLocalLogout', () => {
  it('clears all auth cookies and resolves the language-scoped redirect path', () => {
    const { cookies, deletedNames } = createCookieHarness();

    const redirectPath = completeLocalLogout(
      cookies,
      new URL('https://example.test/sign-in/logout?returnTo=%2Ffr-ca%2Ffavourites'),
      'fr-ca'
    );

    expect(redirectPath).toBe('/fr-ca/favourites');
    expect(deletedNames).toEqual(
      expect.arrayContaining([
        'auth_session',
        'access_token',
        'id_token',
        'refresh_token',
        'pkce_verifier',
        'oidc_nonce',
        'oidc_state',
        'oidc_return_to',
        'auth_error',
        'post_logout_lang',
      ])
    );
  });

  it('falls back to map-browser when returnTo is unsafe and lang is unknown', () => {
    const { cookies, deletedNames } = createCookieHarness();

    const redirectPath = completeLocalLogout(cookies, new URL('https://example.test/sign-in/logout?returnTo=https%3A%2F%2Fevil.example'));

    expect(redirectPath).toBe('/en-ca/map-browser');
    expect(deletedNames.length).toBeGreaterThan(0);
  });
});
