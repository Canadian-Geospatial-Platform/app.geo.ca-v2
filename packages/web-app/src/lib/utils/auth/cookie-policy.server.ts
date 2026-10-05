export function isSecureCookieEnvironment(): boolean {
  return process.env.NODE_ENV !== 'development';
}
