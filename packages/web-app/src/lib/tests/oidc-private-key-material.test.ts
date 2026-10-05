/**
 * Test coverage: Unit tests for OIDC private key material loading/parsing, including secret formats, validation, and cache behavior.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock('$env/dynamic/private', () => ({
  env: {
    OIDC_USE_PRIVATE_KEY_JWT: 'true',
    OIDC_PRIVATE_KEY_SECRET_ID: 'staging/oidc/private-key',
  },
}));

vi.mock('@aws-sdk/client-secrets-manager', () => {
  class SecretsManagerClient {
    send = sendMock;
  }

  class GetSecretValueCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    SecretsManagerClient,
    GetSecretValueCommand,
  };
});

describe('getPrivateKeyMaterial', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('normalizes nested/double-encoded JSON and array payloads into usable PEM', async () => {
    const nestedPrivateKey = JSON.stringify({
      privateKey: ['-----BEGIN PRIVATE KEY-----', 'abc123', '-----END PRIVATE KEY-----'],
    });

    const secretString = JSON.stringify({
      privateKey: nestedPrivateKey,
      certificate: ['-----BEGIN CERTIFICATE-----', 'QUJDRA==', '-----END CERTIFICATE-----'],
    });

    sendMock.mockResolvedValue({ SecretString: secretString });

    const { getPrivateKeyMaterial } = await import('$lib/utils/auth/oidc.server');
    const material = await getPrivateKeyMaterial();

    expect(material).not.toBeNull();
    expect(material?.pem).toBe('-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----');
    expect(material?.x5tS256).toBeTruthy();

    expect(sendMock).toHaveBeenCalledTimes(1);
    const command = sendMock.mock.calls[0]?.[0] as { input?: { SecretId?: string } };
    expect(command.input?.SecretId).toBe('staging/oidc/private-key');
  });

  it('keeps the thumbprint available when certificate material is parseable', async () => {
    const nestedPrivateKey = JSON.stringify({
      privateKey: ['-----BEGIN PRIVATE KEY-----', 'abc123', '-----END PRIVATE KEY-----'],
    });

    const secretString = JSON.stringify({
      privateKey: nestedPrivateKey,
      certificate: '-----BEGIN CERTIFICATE-----\nQUJDRA==\n-----END CERTIFICATE-----',
    });

    sendMock.mockResolvedValue({ SecretString: secretString });

    const { getPrivateKeyMaterial } = await import('$lib/utils/auth/oidc.server');
    const material = await getPrivateKeyMaterial();

    expect(material).not.toBeNull();
    expect(material?.x5tS256).toBeTruthy();
  });

  it('computes the same thumbprint when certificate uses escaped newlines', async () => {
    const nestedPrivateKey = JSON.stringify({
      privateKey: ['-----BEGIN PRIVATE KEY-----', 'abc123', '-----END PRIVATE KEY-----'],
    });

    const secretString = JSON.stringify({
      privateKey: nestedPrivateKey,
      certificate: '-----BEGIN CERTIFICATE-----\\nQUJDRA==\\n-----END CERTIFICATE-----',
    });

    sendMock.mockResolvedValue({ SecretString: secretString });

    const { getPrivateKeyMaterial } = await import('$lib/utils/auth/oidc.server');
    const material = await getPrivateKeyMaterial();

    const expectedThumbprint = createHash('sha256').update(Buffer.from('QUJDRA==', 'base64')).digest('base64url');
    expect(material).not.toBeNull();
    expect(material?.x5tS256).toBe(expectedThumbprint);
  });
});
