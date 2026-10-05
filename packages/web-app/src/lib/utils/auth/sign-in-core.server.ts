import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { encodeBase64Url } from '$lib/utils/auth/base64url';
import { createClientAssertionJwt } from '$lib/utils/auth/client-assertion.server';
import { isSecureCookieEnvironment } from '$lib/utils/auth/cookie-policy.server';
import {
  getOidcConfig,
  getOidcMinimalConfigOrFail,
  getOpenIdConfiguration,
  isHttpsOrLocalhostUrl,
  isLocalhostUrl,
} from '$lib/utils/auth/oidc.server';
import { getAuthorizeScopeValue } from '$lib/utils/auth/scope-policy.server';
import { getLangFromPath, isFrench } from '$lib/utils/language';

/**
 * Cookie name used to persist the one-time PKCE verifier between send and receive routes.
 */
export const PKCE_VERIFIER_COOKIE_NAME = 'pkce_verifier';

/**
 * Cookie name used to persist the one-time OIDC nonce between send and receive routes.
 */
export const OIDC_NONCE_COOKIE_NAME = 'oidc_nonce';

/**
 * Cookie name used to persist the one-time OIDC state token between send and receive routes.
 */
export const OIDC_STATE_COOKIE_NAME = 'oidc_state';

/**
 * Cookie name used to persist the safe return path paired with the one-time OIDC state token.
 */
export const OIDC_RETURN_TO_COOKIE_NAME = 'oidc_return_to';

const TEN_MINUTES_SECONDS = 60 * 10;
const ONE_HOUR_SECONDS = 3600;
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

type OAuthTokenResponse = {
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

async function getTokenErrorDetails(response: Response): Promise<Record<string, unknown>> {
  try {
    const errorBody = (await response.json()) as { error?: unknown; error_description?: unknown };
    return {
      error: errorBody.error,
      error_description: errorBody.error_description,
    };
  } catch {
    return {};
  }
}

/**
 * Builds the locale-independent OIDC callback URL.
 *
 * @param requestUrl - Current request URL.
 * @returns Absolute callback URL used for authorize/token exchange.
 */
function getRedirectUri(requestUrl: URL): string {
  return `${requestUrl.origin}/sign-in/receive`;
}

/**
 * Resolves the OIDC ui_locales value from the localized send route.
 *
 * @param requestUrl - Current request URL.
 * @returns OIDC locale code expected by the provider.
 */
function getUiLocalesValue(requestUrl: URL): 'en-CA' | 'fr-CA' {
  return isFrench(getLangFromPath(requestUrl.pathname)) ? 'fr-CA' : 'en-CA';
}

/**
 * Generates a PKCE code verifier.
 *
 * @returns Random base64url verifier string.
 */
export function createPkceVerifier(): string {
  return encodeBase64Url(randomBytes(32));
}

/**
 * Generates a one-time OIDC nonce used to bind authorize and callback.
 *
 * @returns Random base64url nonce string.
 */
export function createOidcNonce(): string {
  return encodeBase64Url(randomBytes(32));
}

/**
 * Generates a one-time OIDC state token with at least 128 bits of entropy.
 *
 * @returns Random base64url state token.
 */
export function createOidcStateToken(): string {
  return encodeBase64Url(randomBytes(16));
}

/**
 * Derives a PKCE S256 code challenge from a verifier.
 *
 * @param verifier - PKCE code verifier.
 * @returns Base64url-encoded SHA-256 challenge.
 */
export function createPkceChallenge(verifier: string): string {
  return encodeBase64Url(createHash('sha256').update(verifier).digest());
}

/**
 * Reports whether the minimum OIDC configuration exists to show auth UI.
 *
 * @returns True when client id and custom domain are both configured.
 */
export function isOidcConfigured(): boolean {
  return getOidcMinimalConfigOrFail() !== null;
}

/**
 * Builds common cookie options for auth cookies.
 *
 * @param maxAge - Optional cookie max age in seconds.
 * @returns Cookie option object for secure server-side cookies.
 */
function getCookieOptions(maxAge?: number): { path: string; httpOnly: true; sameSite: 'lax'; secure: boolean; maxAge?: number } {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    // Matches session-cookie.server.ts so auth cookies and the session cookie share one secure-flag rule.
    secure: isSecureCookieEnvironment(),
    ...(typeof maxAge === 'number' ? { maxAge } : {}),
  };
}

/**
 * Creates the provider authorize URL for starting OIDC sign-in.
 *
 * @param requestUrl - Current request URL.
 * @param state - Return-to value for post-auth redirect.
 * @param codeChallenge - PKCE S256 challenge for this auth request.
 * @param nonce - One-time nonce to bind the ID token to this login request.
 * @returns Authorize URL when configured; otherwise null.
 */
export function getSignInUrl(requestUrl: URL, state: string, codeChallenge: string, nonce: string): string | null {
  const oidcConfig = getOidcMinimalConfigOrFail();
  if (!oidcConfig) {
    return null;
  }
  const { clientId, customDomain } = oidcConfig;

  if (!isHttpsOrLocalhostUrl(customDomain)) {
    console.error('[auth/authorize] insecure_custom_domain_rejected', { endpointCategory: 'authorization', customDomain });
    return null;
  }

  const redirectUri = getRedirectUri(requestUrl);
  // Include nonce so the callback can bind ID token claims to this authorize request.
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: getAuthorizeScopeValue(),
    redirect_uri: redirectUri,
    state,
    nonce,
    ui_locales: getUiLocalesValue(requestUrl),
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${customDomain}/oauth2/authorize?${params.toString()}`;
}

/**
 * Stores the one-time PKCE verifier in an HTTP-only cookie for callback exchange.
 *
 * @param cookies - Cookie jar from the request context.
 * @param verifier - PKCE verifier generated for this auth attempt.
 */
export function setPkceVerifierCookie(cookies: Cookies, verifier: string): void {
  cookies.set(PKCE_VERIFIER_COOKIE_NAME, verifier, getCookieOptions(TEN_MINUTES_SECONDS));
}

/**
 * Stores the one-time OIDC nonce in an HTTP-only cookie for callback verification.
 *
 * @param cookies - Cookie jar from the request context.
 * @param nonce - Nonce generated for this auth attempt.
 */
export function setOidcNonceCookie(cookies: Cookies, nonce: string): void {
  cookies.set(OIDC_NONCE_COOKIE_NAME, nonce, getCookieOptions(TEN_MINUTES_SECONDS));
}

/**
 * Stores the one-time OIDC state token and paired return path for callback validation.
 *
 * @param cookies - Cookie jar from the request context.
 * @param stateToken - One-time random state token.
 * @param returnTo - Safe in-app return path.
 */
export function setOidcStateCookies(cookies: Cookies, stateToken: string, returnTo: string): void {
  const options = getCookieOptions(TEN_MINUTES_SECONDS);
  cookies.set(OIDC_STATE_COOKIE_NAME, stateToken, options);
  cookies.set(OIDC_RETURN_TO_COOKIE_NAME, returnTo, options);
}

/**
 * Reads and clears the PKCE verifier cookie for one-time token exchange.
 *
 * @param cookies - Cookie jar from the request context.
 * @returns PKCE verifier when present; otherwise null.
 */
export function consumePkceVerifierCookie(cookies: Cookies): string | null {
  const verifier = cookies.get(PKCE_VERIFIER_COOKIE_NAME) ?? null;
  cookies.delete(PKCE_VERIFIER_COOKIE_NAME, { path: '/' });
  return verifier;
}

/**
 * Reads and clears the OIDC nonce cookie for one-time ID token verification.
 *
 * @param cookies - Cookie jar from the request context.
 * @returns Nonce when present; otherwise null.
 */
export function consumeOidcNonceCookie(cookies: Cookies): string | null {
  const nonce = cookies.get(OIDC_NONCE_COOKIE_NAME) ?? null;
  cookies.delete(OIDC_NONCE_COOKIE_NAME, { path: '/' });
  return nonce;
}

/**
 * Reads and clears the OIDC state token and paired return path cookies.
 *
 * @param cookies - Cookie jar from the request context.
 * @returns One-time state token and return path values.
 */
export function consumeOidcStateCookies(cookies: Cookies): { stateToken: string | null; returnTo: string | null } {
  const stateToken = cookies.get(OIDC_STATE_COOKIE_NAME) ?? null;
  const returnTo = cookies.get(OIDC_RETURN_TO_COOKIE_NAME) ?? null;
  cookies.delete(OIDC_STATE_COOKIE_NAME, { path: '/' });
  cookies.delete(OIDC_RETURN_TO_COOKIE_NAME, { path: '/' });
  return { stateToken, returnTo };
}

/**
 * Exchanges an authorization code for provider tokens.
 *
 * Supports two client authentication methods:
 * - `private_key_jwt` (RFC 7523): used when `privateKeyPem` is provided. Signs a JWT assertion
 *   with the private key and sends `client_assertion` + `client_assertion_type` in the request.
 * - `client_secret_post`: fallback when `privateKeyPem` is null. Sends `client_secret` directly.
 *
 * @param code - OAuth authorization code from callback.
 * @param requestUrl - Current request URL, used to derive the redirect URI.
 * @param codeVerifier - PKCE verifier used during the authorize request.
 * @param privateKeyPem - RSA private key in PEM format for private_key_jwt auth; null falls back to client_secret_post.
 * @param x5tS256 - Optional base64url SHA-256 thumbprint of the client certificate for JWT header.
 * @returns Token payload from provider or null when exchange fails.
 */
export async function exchangeCodeForTokens(
  code: string,
  requestUrl: URL,
  codeVerifier: string | null,
  privateKeyPem: string | null = null,
  x5tS256: string | null = null
): Promise<OAuthTokenResponse | null> {
  const { clientId, clientSecret, customDomain, tokenEndpoint, jwtKid } = getOidcConfig();
  const usePrivateKeyJwt = (process.env.OIDC_USE_PRIVATE_KEY_JWT ?? '').toLowerCase() === 'true';
  const tokenUrl = tokenEndpoint || `${customDomain}/oauth2/token`;
  const isLocalhost = isLocalhostUrl(requestUrl.href);
  const telemetry = {
    correlationId: randomUUID(),
    endpointCategory: 'token_endpoint',
    authMethod: privateKeyPem ? 'private_key_jwt' : 'client_secret_post',
    providerHost: (() => {
      try {
        return new URL(customDomain).host;
      } catch {
        return null;
      }
    })(),
  };

  if (!clientId || !customDomain || !codeVerifier) {
    console.error('[auth/token-exchange] missing_required_input', {
      ...telemetry,
      hasClientId: Boolean(clientId),
      hasCustomDomain: Boolean(customDomain),
      hasCodeVerifier: Boolean(codeVerifier),
    });
    return null;
  }

  // Enforce private_key_jwt when configured outside localhost.
  if (usePrivateKeyJwt && !privateKeyPem && !isLocalhost) {
    console.error('[auth/token-exchange] policy_blocked_fallback', {
      ...telemetry,
      requiresPrivateKeyJwt: true,
      hasPrivateKeyPem: false,
      isLocalhost,
    });
    return null;
  }

  // Validate that we have either a private key or a client secret
  if (!privateKeyPem && !clientSecret) {
    console.error('[auth/token-exchange] missing_client_credentials', {
      ...telemetry,
      hasPrivateKeyPem: Boolean(privateKeyPem),
      hasClientSecret: Boolean(clientSecret),
    });
    return null;
  }

  // Construct token endpoint URL and request body for exchanging code
  const redirectUri = getRedirectUri(requestUrl);

  if (!isHttpsOrLocalhostUrl(tokenUrl)) {
    console.error('[auth/token-exchange] insecure_token_endpoint_rejected', {
      ...telemetry,
      tokenUrl,
    });
    return null;
  }

  const bodyParams: Record<string, string> = {
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  };

  // Use private_key_jwt when available, otherwise fall back to client_secret_post
  if (privateKeyPem) {
    // CanadaLogin uses this header to select the registered public key for the assertion.
    const clientAssertion = createClientAssertionJwt(clientId, tokenUrl, privateKeyPem, x5tS256, jwtKid || null);
    bodyParams.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
    bodyParams.client_assertion = clientAssertion;
  } else {
    bodyParams.client_secret = clientSecret;
  }

  const body = new URLSearchParams(bodyParams);

  // Make the token request to the provider
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorDetails = await getTokenErrorDetails(response);
      console.error('[auth/token-exchange] token_request_failed', {
        ...telemetry,
        status: response.status,
        ...errorDetails,
      });
      return null;
    }

    return (await response.json()) as OAuthTokenResponse;
  } catch (error) {
    console.error('[auth/token-exchange] token_request_exception', {
      ...telemetry,
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    return null;
  }
}

/**
 * Exchanges the current refresh token for a new access and ID token pair.
 *
 * Uses the same client authentication policy as the authorization-code exchange.
 * @param refreshToken - Refresh token from the authenticated session.
 * @param privateKeyPem - RSA private key for private_key_jwt, when configured.
 * @param x5tS256 - Optional client certificate thumbprint.
 * @returns Unverified refreshed token payload or null when the provider rejects the request.
 * Callers must verify the returned ID token before treating the session as refreshed.
 */
export async function exchangeRefreshToken(
  refreshToken: string,
  privateKeyPem: string | null = null,
  x5tS256: string | null = null
): Promise<OAuthTokenResponse | null> {
  const { clientId, clientSecret, customDomain, tokenEndpoint, jwtKid } = getOidcConfig();
  const tokenUrl = tokenEndpoint || `${customDomain}/oauth2/token`;
  const usePrivateKeyJwt = (process.env.OIDC_USE_PRIVATE_KEY_JWT ?? '').toLowerCase() === 'true';
  const telemetry = {
    correlationId: randomUUID(),
    endpointCategory: 'token_endpoint',
    grantType: 'refresh_token',
    authMethod: privateKeyPem ? 'private_key_jwt' : 'client_secret_post',
  };

  if (!clientId || !customDomain || !refreshToken || !isHttpsOrLocalhostUrl(tokenUrl)) {
    console.error('[auth/token-refresh] missing_required_input', {
      ...telemetry,
      hasClientId: Boolean(clientId),
      hasCustomDomain: Boolean(customDomain),
      hasRefreshToken: Boolean(refreshToken),
      hasValidTokenUrl: isHttpsOrLocalhostUrl(tokenUrl),
    });
    return null;
  }

  const isLocalhost = isLocalhostUrl(tokenUrl);
  if (usePrivateKeyJwt && !privateKeyPem && !isLocalhost) {
    console.error('[auth/token-refresh] policy_blocked_fallback', {
      ...telemetry,
      requiresPrivateKeyJwt: true,
      hasPrivateKeyPem: false,
      isLocalhost,
    });
    return null;
  }
  if (!privateKeyPem && !clientSecret) {
    console.error('[auth/token-refresh] missing_client_credentials', {
      ...telemetry,
      hasPrivateKeyPem: Boolean(privateKeyPem),
      hasClientSecret: Boolean(clientSecret),
    });
    return null;
  }

  const bodyParams: Record<string, string> = {
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: refreshToken,
  };
  if (privateKeyPem) {
    // Keep key selection consistent between authorization-code and refresh exchanges.
    bodyParams.client_assertion_type = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
    bodyParams.client_assertion = createClientAssertionJwt(clientId, tokenUrl, privateKeyPem, x5tS256, jwtKid || null);
  } else {
    bodyParams.client_secret = clientSecret;
  }

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(bodyParams).toString(),
    });
    if (!response.ok) {
      const errorDetails = await getTokenErrorDetails(response);
      console.error('[auth/token-refresh] token_request_failed', { ...telemetry, status: response.status, ...errorDetails });
      return null;
    }

    return (await response.json()) as OAuthTokenResponse;
  } catch (error) {
    console.error('[auth/token-refresh] token_request_exception', {
      ...telemetry,
      error: error instanceof Error ? error.message : 'unknown_error',
    });
    return null;
  }
}

/**
 * Persists auth tokens in secure HTTP-only cookies.
 *
 * @param cookies - Cookie jar from the request context.
 * @param tokenResponse - Token payload returned by provider.
 * @returns True when required tokens are present and stored.
 */
export function setAuthCookies(cookies: Cookies, tokenResponse: OAuthTokenResponse): boolean {
  if (!tokenResponse.id_token || !tokenResponse.access_token) {
    return false;
  }

  const tokenMaxAge = tokenResponse.expires_in ?? ONE_HOUR_SECONDS;
  const cookieOptions = getCookieOptions(tokenMaxAge);
  cookies.set('id_token', tokenResponse.id_token, cookieOptions);
  cookies.set('access_token', tokenResponse.access_token, cookieOptions);
  // A provider may omit refresh_token when it does not rotate the refresh token.
  if (tokenResponse.refresh_token) {
    cookies.set('refresh_token', tokenResponse.refresh_token, getCookieOptions(THIRTY_DAYS_SECONDS));
  }
  return true;
}

/**
 * Builds the provider logout URL.
 *
 * Uses the `end_session_endpoint` from the OIDC discovery document when available,
 * falling back to `${customDomain}/oauth2/logout`. Uses the standard
 * `post_logout_redirect_uri` parameter per the OIDC Session Management spec.
 *
 * When the `id_token` cookie is present, builds the CATS 3.0.2 request variant 4a
 * (`id_token_hint` + `post_logout_redirect_uri`, no `client_id`). Otherwise builds
 * variant 4c (`client_id` + `post_logout_redirect_uri`).
 *
 * @param requestUrl - Current request URL.
 * @param cookies - Request cookies used to read the current session's raw id_token.
 * @returns Provider logout URL or null when OIDC config is missing.
 */
export async function getOidcLogoutUrl(requestUrl: URL, cookies?: Cookies): Promise<string | null> {
  const oidcConfig = getOidcMinimalConfigOrFail();
  if (!oidcConfig) {
    return null;
  }
  const { clientId, customDomain } = oidcConfig;

  const discovery = await getOpenIdConfiguration(customDomain);
  const logoutEndpoint = discovery?.end_session_endpoint ?? `${customDomain}/oauth2/logout`;

  if (!isHttpsOrLocalhostUrl(logoutEndpoint)) {
    console.error('[auth/logout] insecure_logout_endpoint_rejected', { endpointCategory: 'logout', logoutEndpoint });
    return null;
  }

  const uiLocales = isFrench(getLangFromPath(requestUrl.pathname)) ? 'fr-CA' : 'en-CA';
  // This fixed root callback must match a post_logout_redirect_uri registered with CanadaLogin.
  const postLogoutRedirectUri = `${requestUrl.origin}/sign-in/logout`;

  const idToken = cookies?.get('id_token');
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
    ui_locales: uiLocales,
  });
  if (idToken) {
    params.set('id_token_hint', idToken);
  } else {
    params.set('client_id', clientId);
  }

  return `${logoutEndpoint}?${params.toString()}`;
}
