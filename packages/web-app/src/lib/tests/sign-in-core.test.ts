/**
 * Test coverage: Unit tests for sign-in core helpers such as PKCE, nonce, cookie consumption, and authorize URL generation.
 */
import type { Cookies } from '@sveltejs/kit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createOidcStateToken,
  OIDC_NONCE_COOKIE_NAME,
  OIDC_RETURN_TO_COOKIE_NAME,
  OIDC_STATE_COOKIE_NAME,
  PKCE_VERIFIER_COOKIE_NAME,
  consumeOidcNonceCookie,
  consumeOidcStateCookies,
  consumePkceVerifierCookie,
  createOidcNonce,
  createPkceChallenge,
  createPkceVerifier,
  getOidcLogoutUrl,
  getSignInUrl,
  isOidcConfigured,
  setAuthCookies,
  setOidcNonceCookie,
  setOidcStateCookies,
  setPkceVerifierCookie,
} from '$lib/utils/auth/sign-in-core.server';

vi.mock('$lib/utils/auth/oidc.server', () => ({
  isHttpsOrLocalhostUrl: (value: string) =>
    value.startsWith('https://') || value.startsWith('http://localhost') || value.startsWith('http://127.0.0.1'),
  isLocalhostUrl: (value: string) =>
    value.startsWith('http://localhost') ||
    value.startsWith('http://127.0.0.1') ||
    value.startsWith('https://localhost') ||
    value.startsWith('https://127.0.0.1'),
  getOidcMinimalConfigOrFail: () => ({ clientId: 'client-id-123', customDomain: 'https://auth.example.test' }),
  getOidcConfig: () => ({
    clientId: 'client-id-123',
    clientSecret: 'client-secret-123',
    customDomain: 'https://auth.example.test',
    tokenEndpoint: 'https://auth.example.test/oauth2/token',
    jwtKid: 'test-kid',
  }),
  getOpenIdConfiguration: vi.fn().mockResolvedValue({
    issuer: 'https://auth.example.test',
    jwks_uri: 'https://auth.example.test/oauth2/jwks',
    end_session_endpoint: 'https://auth.example.test/logout',
  }),
}));

type CookieHarness = {
  cookies: Cookies;
  deletedNames: string[];
  setOptions: Map<string, Record<string, unknown>>;
};

/**
 * Creates a cookie test harness that records deleted cookie names and the options each cookie was set with.
 *
 * @param initialValues - Initial cookie values.
 * @returns Cookie harness with cookies test double, deletion log, and recorded set options.
 */
function createCookieHarness(initialValues: Record<string, string> = {}): CookieHarness {
  const values = new Map<string, string>(Object.entries(initialValues));
  const deletedNames: string[] = [];
  const setOptions = new Map<string, Record<string, unknown>>();

  const cookies = {
    get(name: string): string | undefined {
      return values.get(name);
    },
    set(name: string, value: string, options?: Record<string, unknown>): void {
      values.set(name, value);
      if (options) {
        setOptions.set(name, options);
      }
    },
    delete(name: string): void {
      deletedNames.push(name);
      values.delete(name);
    },
  } as unknown as Cookies;

  return { cookies, deletedNames, setOptions };
}

describe('sign-in-core helpers', () => {
  beforeEach(() => {
    vi.stubEnv('OIDC_CLIENT_ID', 'client-id-123');
    vi.stubEnv('OIDC_CUSTOM_DOMAIN', 'https://auth.example.test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('creates the RFC7636 S256 code challenge from a known verifier', () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

    expect(createPkceChallenge(verifier)).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('creates unique OIDC state tokens with at least 128 bits of entropy', () => {
    const stateA = createOidcStateToken();
    const stateB = createOidcStateToken();

    expect(stateA).not.toBe(stateB);
    expect(stateA.length).toBeGreaterThanOrEqual(22);
    expect(stateB.length).toBeGreaterThanOrEqual(22);
  });

  it('consumes and clears the PKCE verifier cookie', () => {
    const { cookies, deletedNames } = createCookieHarness({
      [PKCE_VERIFIER_COOKIE_NAME]: 'pkce-value',
    });

    expect(consumePkceVerifierCookie(cookies)).toBe('pkce-value');
    expect(deletedNames).toContain(PKCE_VERIFIER_COOKIE_NAME);
  });

  it('clears the nonce cookie even when the value is missing', () => {
    const { cookies, deletedNames } = createCookieHarness();

    expect(consumeOidcNonceCookie(cookies)).toBeNull();
    expect(deletedNames).toContain(OIDC_NONCE_COOKIE_NAME);
  });

  it('builds authorize URL with configured requested scopes', () => {
    vi.stubEnv('OIDC_REQUESTED_SCOPES', 'openid email language');

    const signInUrl = getSignInUrl(
      new URL('https://app.example.test/en-ca/sign-in/send'),
      '/en-ca/map-browser',
      'pkce-challenge',
      'nonce-123'
    );

    expect(signInUrl).toBeTruthy();
    const params = new URL(String(signInUrl)).searchParams;
    expect(params.get('client_id')).toBe('client-id-123');
    expect(params.get('response_type')).toBe('code');
    expect(params.get('redirect_uri')).toBe('https://app.example.test/sign-in/receive');
    expect(params.get('state')).toBe('/en-ca/map-browser');
    expect(params.get('nonce')).toBe('nonce-123');
    expect(params.get('code_challenge')).toBe('pkce-challenge');
    expect(params.get('code_challenge_method')).toBe('S256');
    expect(params.get('ui_locales')).toBe('en-CA');
    expect(params.get('scope')).toBe('openid email language');
  });

  it('sets ui_locales to fr-CA when the send route is French', () => {
    const signInUrl = getSignInUrl(
      new URL('https://app.example.test/fr-ca/sign-in/send'),
      '/en-ca/map-browser',
      'pkce-challenge',
      'nonce-123'
    );

    expect(signInUrl).toBeTruthy();
    const params = new URL(String(signInUrl)).searchParams;
    expect(params.get('ui_locales')).toBe('fr-CA');
  });

  it('uses the fixed post_logout_redirect_uri and assigns French ui_locales for French logout', async () => {
    const logoutUrl = await getOidcLogoutUrl(new URL('https://app.example.test/fr-ca/sign-in/oidc-logout'));

    const params = new URL(String(logoutUrl)).searchParams;
    expect(params.get('client_id')).toBe('client-id-123');
    expect(params.get('post_logout_redirect_uri')).toBe('https://app.example.test/sign-in/logout');
    expect(params.get('ui_locales')).toBe('fr-CA');
  });

  it('includes the current ID token as the RP-initiated logout hint', async () => {
    const cookies = {
      get: (name: string) => (name === 'id_token' ? 'signed-id-token' : undefined),
    } as unknown as Cookies;

    const logoutUrl = await getOidcLogoutUrl(new URL('https://app.example.test/en-ca/sign-in/oidc-logout'), cookies);

    const params = new URL(String(logoutUrl)).searchParams;
    expect(params.get('id_token_hint')).toBe('signed-id-token');
    expect(params.get('client_id')).toBeNull();
  });

  it('reports OIDC as configured when client id and custom domain are set', () => {
    expect(isOidcConfigured()).toBe(true);
  });

  it('creates unique PKCE verifiers and nonces', () => {
    ``;
    expect(createPkceVerifier()).not.toBe(createPkceVerifier());
    expect(createOidcNonce()).not.toBe(createOidcNonce());
  });

  it('sets the PKCE verifier cookie with a 10-minute max age', () => {
    const { cookies, setOptions } = createCookieHarness();

    setPkceVerifierCookie(cookies, 'verifier-1');

    expect(cookies.get(PKCE_VERIFIER_COOKIE_NAME)).toBe('verifier-1');
    expect(setOptions.get(PKCE_VERIFIER_COOKIE_NAME)).toMatchObject({ path: '/', httpOnly: true, sameSite: 'lax', maxAge: 600 });
  });

  it('sets the OIDC nonce cookie with a 10-minute max age', () => {
    const { cookies, setOptions } = createCookieHarness();

    setOidcNonceCookie(cookies, 'nonce-1');

    expect(cookies.get(OIDC_NONCE_COOKIE_NAME)).toBe('nonce-1');
    expect(setOptions.get(OIDC_NONCE_COOKIE_NAME)).toMatchObject({ maxAge: 600 });
  });

  it('sets and consumes the paired OIDC state and return-to cookies', () => {
    const { cookies, deletedNames, setOptions } = createCookieHarness();

    setOidcStateCookies(cookies, 'state-token-1', '/en-ca/map-browser');

    expect(cookies.get(OIDC_STATE_COOKIE_NAME)).toBe('state-token-1');
    expect(cookies.get(OIDC_RETURN_TO_COOKIE_NAME)).toBe('/en-ca/map-browser');
    expect(setOptions.get(OIDC_STATE_COOKIE_NAME)).toMatchObject({ maxAge: 600 });

    const consumed = consumeOidcStateCookies(cookies);

    expect(consumed).toEqual({ stateToken: 'state-token-1', returnTo: '/en-ca/map-browser' });
    expect(deletedNames).toEqual(expect.arrayContaining([OIDC_STATE_COOKIE_NAME, OIDC_RETURN_TO_COOKIE_NAME]));
  });

  it('marks cookies secure only in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const prod = createCookieHarness();
    setPkceVerifierCookie(prod.cookies, 'verifier-1');
    expect(prod.setOptions.get(PKCE_VERIFIER_COOKIE_NAME)).toMatchObject({ secure: true });

    vi.stubEnv('NODE_ENV', 'development');
    const dev = createCookieHarness();
    setPkceVerifierCookie(dev.cookies, 'verifier-1');
    expect(dev.setOptions.get(PKCE_VERIFIER_COOKIE_NAME)).toMatchObject({ secure: false });
  });

  it('sets auth cookies and returns true when id_token and access_token are present', () => {
    const { cookies, setOptions } = createCookieHarness();

    const didSet = setAuthCookies(cookies, {
      id_token: 'id-token-1',
      access_token: 'access-token-1',
      refresh_token: 'refresh-token-1',
      expires_in: 1800,
      token_type: 'Bearer',
    });

    expect(didSet).toBe(true);
    expect(cookies.get('id_token')).toBe('id-token-1');
    expect(cookies.get('access_token')).toBe('access-token-1');
    expect(cookies.get('refresh_token')).toBe('refresh-token-1');
    expect(setOptions.get('id_token')).toMatchObject({ maxAge: 1800 });
    expect(setOptions.get('refresh_token')).toMatchObject({ maxAge: 60 * 60 * 24 * 30 });
  });

  it('does not set a refresh_token cookie when the provider omits it', () => {
    const { cookies } = createCookieHarness();

    setAuthCookies(cookies, { id_token: 'id-token-1', access_token: 'access-token-1' });

    expect(cookies.get('refresh_token')).toBeUndefined();
  });

  it('returns false and sets no cookies when id_token or access_token is missing', () => {
    const { cookies } = createCookieHarness();

    expect(setAuthCookies(cookies, { access_token: 'access-token-1' })).toBe(false);
    expect(cookies.get('id_token')).toBeUndefined();
    expect(cookies.get('access_token')).toBeUndefined();
  });
});
