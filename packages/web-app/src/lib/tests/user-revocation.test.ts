/**
 * Test coverage: Unit tests for user auth revocation marker persistence and error handling behavior.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { docSendMock, getTokenMock } = vi.hoisted(() => ({
  docSendMock: vi.fn(),
  getTokenMock: vi.fn(),
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn(),
}));

vi.mock('@aws-sdk/lib-dynamodb', () => {
  class UpdateCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  return {
    DynamoDBDocumentClient: {
      from: vi.fn(() => ({ send: docSendMock })),
    },
    GetCommand: class {},
    UpdateCommand,
  };
});

vi.mock('#lib/utils/aws-region.js', () => ({
  getAwsRegion: vi.fn(() => 'ca-central-1'),
}));

vi.mock('#lib/utils/auth/parse-jwt.js', () => ({
  getToken: getTokenMock,
}));

vi.mock('#lib/utils/auth/auth-cookies.js', () => ({
  clearAuthCookies: vi.fn(),
}));

import type { Cookies } from '@sveltejs/kit';
import { getToken } from '#lib/utils/auth/parse-jwt.js';
import { markUserAuthRevoked, putUserData } from '#lib/db/user.js';

describe('putUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('USER_TABLE_NAME', 'users-table');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('updates profile fields without replacing authentication revocation attributes', async () => {
    vi.mocked(getToken).mockResolvedValue({ ok: true, value: { sub: 'user-123' } });
    docSendMock.mockResolvedValueOnce({});

    await expect(putUserData({ uuid: 'user-123', favourites: ['record-1'], mapConfigs: [] }, {} as Cookies)).resolves.toEqual({ ok: true });

    const command = docSendMock.mock.calls[0]?.[0] as { input?: Record<string, unknown> };
    expect(command.input?.UpdateExpression).toBe('SET #favourites = :favourites, #mapConfigs = :mapConfigs');
    expect(command.input?.Key).toEqual({ uuid: 'user-123' });
    expect(command.input?.ExpressionAttributeNames).toEqual({
      '#favourites': 'favourites',
      '#mapConfigs': 'mapConfigs',
    });
    expect(command.input?.ExpressionAttributeValues).toEqual({
      ':favourites': ['record-1'],
      ':mapConfigs': [],
    });
  });
});

describe('markUserAuthRevoked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('USER_TABLE_NAME', 'users-table');
  });

  it('writes a monotonic condition so authRevokedAt cannot move backward', async () => {
    docSendMock.mockResolvedValueOnce({});

    await expect(markUserAuthRevoked('user-123', 1700000000, 'logout-jti-1')).resolves.toBe('stored');

    expect(docSendMock).toHaveBeenCalledTimes(1);
    const command = docSendMock.mock.calls[0]?.[0] as { input?: Record<string, unknown> };
    const conditionExpression = String(command.input?.ConditionExpression ?? '');

    expect(conditionExpression).toContain('attribute_not_exists(authRevokedAt) OR :authRevokedAt >= authRevokedAt');
    // DynamoDB rejects unused expression attribute values.
    const values = command.input?.ExpressionAttributeValues as Record<string, unknown>;
    expect(values).not.toHaveProperty(':emptyMap');
  });

  it('writes a sid-specific monotonic condition when sid-based revocation is used', async () => {
    docSendMock.mockResolvedValueOnce({}).mockResolvedValueOnce({});

    await expect(markUserAuthRevoked('user-123', 1700000000, 'logout-jti-1', 'session-123')).resolves.toBe('stored');

    expect(docSendMock).toHaveBeenCalledTimes(2);
    const ensureMap = docSendMock.mock.calls[0]?.[0] as { input?: Record<string, unknown> };
    expect(ensureMap.input?.UpdateExpression).toBe('SET #authRevokedSids = if_not_exists(#authRevokedSids, :emptyMap)');
    expect(ensureMap.input?.ConditionExpression).toBeUndefined();

    const command = docSendMock.mock.calls[1]?.[0] as { input?: Record<string, unknown> };
    const updateExpression = String(command.input?.UpdateExpression ?? '');
    const conditionExpression = String(command.input?.ConditionExpression ?? '');
    const names = command.input?.ExpressionAttributeNames as Record<string, string>;
    const values = command.input?.ExpressionAttributeValues as Record<string, unknown>;

    expect(updateExpression).toContain('#authRevokedSids.#sid = :authRevokedAt');
    // Setting the map and a nested path in one expression is an overlapping-path error.
    expect(updateExpression).not.toContain('if_not_exists(#authRevokedSids');
    expect(values).not.toHaveProperty(':emptyMap');
    expect(conditionExpression).toContain('attribute_not_exists(#authRevokedSids.#sid) OR :authRevokedAt >= #authRevokedSids.#sid');
    expect(names).toMatchObject({ '#authRevokedSids': 'authRevokedSids', '#sid': 'session-123' });
  });

  it('returns replayed when DynamoDB conditional update fails', async () => {
    docSendMock.mockRejectedValueOnce({ name: 'ConditionalCheckFailedException' });

    await expect(markUserAuthRevoked('user-123', 1700000000, 'logout-jti-1')).resolves.toBe('replayed');
  });
});
