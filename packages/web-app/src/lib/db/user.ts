import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getToken } from '$lib/utils/auth/parse-jwt';
import { getAwsRegion } from '$lib/utils/aws-region';
import type { UserInfo, UserData, TokenResponse } from './db-types';
import type { Cookies } from '@sveltejs/kit';
import { USER_TABLE_NAME } from '$env/static/private';
import { clearAuthCookies } from '$lib/utils/auth/auth-cookies';

const awsRegion = getAwsRegion();
const client = new DynamoDBClient({ region: awsRegion });
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

let didWarnExpiredAwsToken = false;
const BACK_CHANNEL_LOGOUT_REPLAY_WINDOW_SECONDS = 10 * 60;

/**
 * Checks whether an SDK error indicates expired AWS temporary credentials.
 *
 * @param error - Unknown error thrown by AWS SDK call.
 * @returns True when the error matches an expired token shape.
 */
function isExpiredAwsTokenError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { name?: unknown; __type?: unknown };
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const type = typeof candidate.__type === 'string' ? candidate.__type : '';
  return name.includes('ExpiredTokenException') || type.includes('ExpiredTokenException');
}

/**
 * Checks whether a DynamoDB conditional update failed.
 *
 * @param error - Unknown error thrown by AWS SDK call.
 * @returns True when the error indicates a failed condition expression.
 */
function isConditionalCheckFailedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { name?: unknown; __type?: unknown };
  const name = typeof candidate.name === 'string' ? candidate.name : '';
  const type = typeof candidate.__type === 'string' ? candidate.__type : '';
  return name.includes('ConditionalCheckFailedException') || type.includes('ConditionalCheckFailedException');
}

/**
 * Logs a single actionable warning for expired local AWS credentials.
 */
function warnExpiredAwsTokenOnce(): void {
  if (didWarnExpiredAwsToken) {
    return;
  }

  didWarnExpiredAwsToken = true;
  console.warn('[auth/user] AWS session credentials are expired; DynamoDB user data is unavailable until credentials are refreshed.');
}

/**
 * Extracts the stable user identifier from decoded token claims.
 *
 * @param token - Parsed token response.
 * @returns User key (`sub` preferred, `username` fallback) or null.
 */
function getUserKey(token: TokenResponse): string | null {
  if (!token.ok || !token.value) {
    return null;
  }
  return (token.value.sub as string | undefined) ?? (token.value.username as string | undefined) ?? null;
}

/**
 * Extracts the issue time from the token payload.
 *
 * @param token - Parsed token response.
 * @returns The issue time in seconds since epoch when available; otherwise null.
 */
function getTokenIssuedAt(token: TokenResponse): number | null {
  if (!token.ok || !token.value || typeof token.value.iat !== 'number') {
    return null;
  }

  return token.value.iat;
}

/**
 * Fetches user data from the database using the provided cookies.
 *
 * @param cookies - The cookies object containing user session data.
 * @returns A promise that resolves to user data plus status:
 * `anonymous` when no active user is resolved,
 * `ok` when storage data is returned,
 * `missing` when the user row is not yet created,
 * and `unavailable` when storage access fails.
 */
const getUserData = async (cookies: Cookies): Promise<UserInfo> => {
  const token: TokenResponse = await getToken(cookies);
  const userKey = getUserKey(token);
  if (!userKey) {
    return { Item: { uuid: null, favourites: [], mapConfigs: [] }, status: 'anonymous', sessionExpired: token.staleCleared === true };
  }

  const unavailableUserData: UserInfo = { Item: { uuid: userKey, favourites: [], mapConfigs: [] }, status: 'unavailable' };
  const missingUserData: UserInfo = { Item: { uuid: userKey, favourites: [], mapConfigs: [] }, status: 'missing' };

  if (!USER_TABLE_NAME) {
    return unavailableUserData;
  }

  const command = new GetCommand({
    TableName: USER_TABLE_NAME,
    Key: {
      uuid: userKey,
    },
  });

  let response: UserInfo;
  try {
    response = (await docClient.send(command)) as unknown as UserInfo;
  } catch (error) {
    if (isExpiredAwsTokenError(error)) {
      warnExpiredAwsTokenOnce();
      return unavailableUserData;
    }

    console.error('[auth/user] fetch_failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return unavailableUserData;
  }

  if (response?.Item === undefined || response.Item === null) {
    return missingUserData;
  }

  if (!Array.isArray(response.Item.favourites)) {
    response.Item.favourites = [];
  }

  if (!Array.isArray(response.Item.mapConfigs)) {
    response.Item.mapConfigs = [];
  }

  const tokenIssuedAt = getTokenIssuedAt(token);

  // Reject only tokens strictly older than the revocation second. Equality can occur when
  // logout and login are processed within the same second by the provider.
  if (typeof response.Item.authRevokedAt === 'number' && (tokenIssuedAt === null || tokenIssuedAt < response.Item.authRevokedAt)) {
    clearAuthCookies(cookies);
    return { Item: { uuid: null, favourites: [], mapConfigs: [] }, status: 'anonymous' };
  }
  return { Item: response.Item, status: 'ok' };
};

/**
 * Stores user data in the database.
 *
 * @param data - The user data to store.
 * @param cookies - The cookies object containing user session data.
 * @returns A promise that resolves to the result of the operation.
 */
const putUserData = async (data: Partial<UserData>, cookies: Cookies): Promise<Record<'ok', boolean>> => {
  const token: TokenResponse = await getToken(cookies);
  const userKey = getUserKey(token);
  if (!userKey) return { ok: false };

  if (!USER_TABLE_NAME) {
    return { ok: false };
  }

  data.uuid = userKey;

  try {
    await docClient.send(
      new PutCommand({
        TableName: USER_TABLE_NAME,
        Item: data,
      })
    );
    return { ok: true };
  } catch (error) {
    if (isExpiredAwsTokenError(error)) {
      warnExpiredAwsTokenOnce();
      return { ok: false };
    }

    const itemSizeEstimateBytes = JSON.stringify(data).length;

    // Handle DynamoDB item size limit error
    if (error instanceof Error && error.message.includes('Item size has exceeded')) {
      console.error('[auth/user] put_failed_item_too_large', {
        itemSizeEstimateBytes,
        error: error.message,
      });
      return { ok: false };
    }

    console.error('[auth/user] put_failed', {
      itemSizeEstimateBytes,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false };
  }
};

/**
 * Marks a user session as revoked for back-channel logout handling.
 *
 * @param userKey - Stable user identifier from the token.
 * @param revokedAt - Revocation time in seconds since epoch.
 * @param logoutTokenJti - Logout token identifier used for replay detection.
 * @returns `stored` when persisted, `replayed` for duplicate/rejected conditional updates, otherwise `error`.
 */
const markUserAuthRevoked = async (
  userKey: string,
  revokedAt: number,
  logoutTokenJti: string
): Promise<'stored' | 'replayed' | 'error'> => {
  if (!USER_TABLE_NAME) {
    return 'error';
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const replayWindowCutoff = nowSeconds - BACK_CHANNEL_LOGOUT_REPLAY_WINDOW_SECONDS;

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: USER_TABLE_NAME,
        Key: {
          uuid: userKey,
        },
        UpdateExpression:
          'SET authRevokedAt = :authRevokedAt, lastBackChannelLogoutJti = :logoutTokenJti, lastBackChannelLogoutJtiSeenAt = :seenAt',
        ConditionExpression:
          '(attribute_not_exists(lastBackChannelLogoutJti) OR lastBackChannelLogoutJti <> :logoutTokenJti OR attribute_not_exists(lastBackChannelLogoutJtiSeenAt) OR lastBackChannelLogoutJtiSeenAt < :replayWindowCutoff) AND (attribute_not_exists(authRevokedAt) OR :authRevokedAt >= authRevokedAt)',
        ExpressionAttributeValues: {
          ':authRevokedAt': revokedAt,
          ':logoutTokenJti': logoutTokenJti,
          ':seenAt': nowSeconds,
          ':replayWindowCutoff': replayWindowCutoff,
        },
      })
    );
    return 'stored';
  } catch (error) {
    if (isConditionalCheckFailedError(error)) {
      return 'replayed';
    }

    if (isExpiredAwsTokenError(error)) {
      warnExpiredAwsTokenOnce();
      return 'error';
    }

    console.error('[auth/user] revoke_marker_store_failed', {
      error: error instanceof Error ? error.message : String(error),
      userKey,
    });
    return 'error';
  }
};

export { getUserData, putUserData, markUserAuthRevoked };
