/**
 * Test coverage: Unit tests for user auth revocation marker persistence and error handling behavior.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { docSendMock } = vi.hoisted(() => ({
  docSendMock: vi.fn(),
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
    PutCommand: class {},
    UpdateCommand,
  };
});

vi.mock('$lib/utils/aws-region', () => ({
  getAwsRegion: vi.fn(() => 'ca-central-1'),
}));

vi.mock('$lib/utils/auth/parse-jwt', () => ({
  getToken: vi.fn(),
}));

vi.mock('$lib/utils/auth/auth-cookies', () => ({
  clearAuthCookies: vi.fn(),
}));

vi.mock('$env/static/private', () => ({
  USER_TABLE_NAME: 'users-table',
}));

import { markUserAuthRevoked } from '$lib/db/user';

describe('markUserAuthRevoked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes a monotonic condition so authRevokedAt cannot move backward', async () => {
    docSendMock.mockResolvedValueOnce({});

    await expect(markUserAuthRevoked('user-123', 1700000000, 'logout-jti-1')).resolves.toBe('stored');

    expect(docSendMock).toHaveBeenCalledTimes(1);
    const command = docSendMock.mock.calls[0]?.[0] as { input?: Record<string, unknown> };
    const conditionExpression = String(command.input?.ConditionExpression ?? '');

    expect(conditionExpression).toContain('attribute_not_exists(authRevokedAt) OR :authRevokedAt >= authRevokedAt');
  });

  it('returns replayed when DynamoDB conditional update fails', async () => {
    docSendMock.mockRejectedValueOnce({ name: 'ConditionalCheckFailedException' });

    await expect(markUserAuthRevoked('user-123', 1700000000, 'logout-jti-1')).resolves.toBe('replayed');
  });
});
