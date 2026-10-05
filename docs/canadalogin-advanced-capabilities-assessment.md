# CanadaLogin OIDC Advanced Capabilities Assessment

Date: 2026-05-29
Scope: Optional/advanced form sections beyond core Authorization Code + PKCE + private_key_jwt + ID token validation.

## Summary

Current implementation is strong on core controls and preferred baseline methods, but advanced JOSE features are intentionally minimal.

- Recommended posture now: defer advanced capabilities unless explicitly required for compliance testing or go-live conditions.
- Recommended immediate action: keep documenting decisions and risk acceptance in RP registration artifacts.

## Capability Matrix

| Capability | Current status | Evidence | Risk if deferred | Recommendation |
|---|---|---|---|---|
| Request Object signing (`request` JWT in auth request) | Not supported | Authorize URL is plain query params in sign-in flow. | Medium (depends on provider requirement) | Defer unless CanadaLogin mandates signed request objects. |
| Request Object encryption (JWE) | Not supported | No JWE request object generation path. | Medium | Defer unless mandated. |
| Token endpoint message signing algorithms beyond RS256 | Partially supported | Client assertion JWT uses RS256 only. | Low to Medium | Keep RS256 unless partner requires PS*/ES*/RS384/RS512. |
| ID token signature algorithm breadth beyond RS256 | Not supported | ID token verifier enforces `alg=RS256`. | Medium | Keep RS256 unless provider switches or mandates additional algorithms. |
| UserInfo endpoint signature validation | Not supported | No UserInfo call path implemented. | Low currently | Maintain current decision to rely on verified ID token claims. |
| JARM (`response_mode` JWT-secured auth response) | Not supported | No `response_mode` support and no JWE/JWS response object parsing. | Medium to High if required by compliance profile | Defer unless explicitly required in staging compliance tests. |
| Decryption of token endpoint response (JWE) | Not supported | Token exchange expects JSON token response, no JWE decrypt path. | Medium | Defer unless CanadaLogin enables encrypted token responses. |
| Decryption of encrypted ID token/UserInfo JWE | Not supported | No JWE decryption path in token verification flow. | Medium | Defer unless required by partner profile. |

## Detailed Findings

1. Request Object and JARM are absent from the authorize/callback flows.
2. JOSE algorithm policy is intentionally strict (RS256), which reduces complexity and attack surface but limits interoperability with advanced profiles.
3. UserInfo is intentionally out of scope right now and documented accordingly.

## Recommended Decision for Current Registration Cycle

1. Submit with advanced encryption/signing options marked as not supported where optional.
2. Explicitly note roadmap stance: feature can be revisited if CanadaLogin compliance testing flags it as required.
3. Keep core posture emphasis: PKCE S256, private_key_jwt enforcement for non-local environments, back-channel logout with replay protection, structured auth telemetry.

## Revisit Triggers

- CanadaLogin test/staging certification requires Request Object, JARM, or JWE.
- Provider metadata indicates required algorithms outside RS256.
- Product requirements need claims only available through UserInfo with signed/encrypted response handling.

## Suggested Implementation Order if Mandated

1. Add JOSE abstraction layer for JWS/JWE support (request object + response parsing).
2. Implement Request Object signing first (lowest blast radius).
3. Implement JARM/JWE response parsing and decryption.
4. Expand algorithm support policy with explicit allowlist and tests.
5. Add compliance-focused integration tests per environment profile.
