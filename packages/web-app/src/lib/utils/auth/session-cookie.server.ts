import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { isSecureCookieEnvironment } from '$lib/utils/auth/cookie-policy.server';

export const SESSION_COOKIE_NAME = 'auth_session';
export const SESSION_INACTIVITY_SECONDS = 60 * 60;
export const SESSION_MAXIMUM_SECONDS = 12 * 60 * 60;

const SESSION_COOKIE_PATH = '/';

type SessionCookiePayload = {
  sub: string;
  sid: string | null;
  sessionStartedAt: number;
  lastActivityAt: number;
};

function getSessionSecret(): string | null {
  return env.SESSION_COOKIE_SECRET ?? process.env.SESSION_COOKIE_SECRET ?? null;
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function readPayload(value: string, secret: string): SessionCookiePayload | null {
  const [encodedPayload, encodedSignature] = value.split('.');
  if (!encodedPayload || !encodedSignature) return null;

  const expectedSignature = Buffer.from(sign(encodedPayload, secret));
  const actualSignature = Buffer.from(encodedSignature);
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as Partial<SessionCookiePayload>;
    if (
      typeof payload.sub !== 'string' ||
      (payload.sid !== null && typeof payload.sid !== 'string') ||
      typeof payload.sessionStartedAt !== 'number' ||
      typeof payload.lastActivityAt !== 'number'
    ) {
      return null;
    }
    return payload as SessionCookiePayload;
  } catch {
    return null;
  }
}

function writeCookie(cookies: Cookies, payload: SessionCookiePayload): void {
  const secret = getSessionSecret();
  if (!secret) return;

  const encodedPayload = encode(JSON.stringify(payload));
  cookies.set(SESSION_COOKIE_NAME, `${encodedPayload}.${sign(encodedPayload, secret)}`, {
    path: SESSION_COOKIE_PATH,
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookieEnvironment(),
    maxAge: SESSION_MAXIMUM_SECONDS,
  });
}

/**
 * Creates the server-owned session state after a verified CanadaLogin sign-in.
 *
 * @param cookies - Request cookie jar used for the HTTP-only session cookie.
 * @param sub - Verified subject identifier.
 * @param sid - Optional verified CanadaLogin session identifier.
 * @param nowSeconds - Server timestamp in epoch seconds.
 */
export function createSessionCookie(cookies: Cookies, sub: string, sid: string | null, nowSeconds = Math.floor(Date.now() / 1000)): void {
  writeCookie(cookies, {
    sub,
    sid,
    sessionStartedAt: nowSeconds,
    lastActivityAt: nowSeconds,
  });
}

/**
 * Validates and touches the server-owned session state.
 *
 * @param cookies - Request cookie jar used for the HTTP-only session cookie.
 * @param sub - Verified subject identifier from the current ID token.
 * @param sid - Optional verified CanadaLogin session identifier.
 * @param nowSeconds - Server timestamp in epoch seconds.
 * @returns True when the session is valid and within both guide limits.
 */
export function touchSessionCookie(cookies: Cookies, sub: string, sid: string | null, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const secret = getSessionSecret();
  if (!secret) return process.env.NODE_ENV !== 'production';

  const current = readPayload(cookies.get(SESSION_COOKIE_NAME) ?? '', secret);
  if (
    !current ||
    current.sub !== sub ||
    current.sid !== sid ||
    nowSeconds - current.lastActivityAt > SESSION_INACTIVITY_SECONDS ||
    nowSeconds - current.sessionStartedAt > SESSION_MAXIMUM_SECONDS
  ) {
    cookies.delete(SESSION_COOKIE_NAME, { path: SESSION_COOKIE_PATH });
    return false;
  }

  writeCookie(cookies, { ...current, lastActivityAt: nowSeconds });
  return true;
}

/**
 * Clears the server-owned session state alongside CanadaLogin auth cookies.
 *
 * @param cookies - Request cookie jar containing the session cookie.
 */
export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: SESSION_COOKIE_PATH });
}
