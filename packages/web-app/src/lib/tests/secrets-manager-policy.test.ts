/**
 * Test coverage: Unit tests for Secrets Manager ARN normalization and policy-target helper behavior.
 */
import { describe, expect, it } from 'vitest';
import { toSecretsManagerResourceArn } from '../../../../../config/secrets-manager-policy';

describe('toSecretsManagerResourceArn', () => {
  it('returns null for empty values', () => {
    expect(toSecretsManagerResourceArn('', 'ca-central-1')).toBeNull();
    expect(toSecretsManagerResourceArn('   ', 'ca-central-1')).toBeNull();
  });

  it('passes through full Secrets Manager ARNs unchanged', () => {
    const arn = 'arn:aws:secretsmanager:ca-central-1:123456789012:secret:prod/oidc/private-key-AbCdEf';
    expect(toSecretsManagerResourceArn(arn, 'ca-central-1')).toBe(arn);
  });

  it('converts valid secret names to policy resource ARNs', () => {
    expect(toSecretsManagerResourceArn('staging/oidc/private-key', 'ca-central-1')).toBe(
      'arn:aws:secretsmanager:ca-central-1:*:secret:staging/oidc/private-key*'
    );
  });

  it('rejects malformed secret names', () => {
    expect(toSecretsManagerResourceArn('staging/oidc/private key', 'ca-central-1')).toBeNull();
    expect(toSecretsManagerResourceArn('staging/oidc/private-key*', 'ca-central-1')).toBeNull();
  });
});
