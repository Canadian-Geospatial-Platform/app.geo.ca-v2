/**
 * Determines whether authentication cookies should use the Secure attribute.
 *
 * @returns False only in development; true in other environments.
 */
export function isSecureCookieEnvironment(): boolean {
  return process.env.NODE_ENV !== 'development';
}

/**
 * Reads the optional domain shared by authentication cookies.
 *
 * @returns Cookie domain options when configured, otherwise an empty object.
 */
export function getCookieDomainOptions(): { domain?: string } {
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  return domain ? { domain } : {};
}
