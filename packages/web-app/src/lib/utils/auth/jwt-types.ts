/**
 * Minimal JWT header shape used by auth token validators.
 */
export type JwtHeader = {
  alg?: string;
  kid?: string;
  typ?: string;
  [key: string]: unknown;
};

/**
 * Subset of OpenID Provider metadata required for discovery/JWKS lookups.
 */
export type OpenIdConfiguration = {
  issuer?: string;
  jwks_uri?: string;
  end_session_endpoint?: string;
};

/**
 * Minimal JWK shape required for RSA signature verification.
 */
export type JsonWebKey = {
  kid?: string;
  kty?: string;
  use?: string;
  alg?: string;
  [key: string]: unknown;
};
