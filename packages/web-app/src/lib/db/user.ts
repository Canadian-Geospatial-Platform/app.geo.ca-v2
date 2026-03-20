import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getToken } from '$lib/utils/parse-jwt';
import type { UserInfo, UserData, TokenResponse } from './db-types';
import type { Cookies } from '@sveltejs/kit';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Fetches user data from the database using the provided cookies.
 *
 * @param cookies - The cookies object containing user session data.
 * @returns A promise that resolves to the user data.
 */
const getUserData = async (cookies: Cookies): Promise<UserInfo> => {
  let token: TokenResponse = await getToken(cookies);
  if (!token.ok) return { Item: { uuid: null, favourites: [] } };
  const command = new GetCommand({
    TableName: process.env.USER_TABLE_NAME,
    Key: {
      uuid: token.value!.username,
    },
  });

  let response: UserInfo = { Item: { uuid: null, favourites: [] } };
  try {
    response = (await docClient.send(command)) as unknown as UserInfo;
  } catch (error) {
    console.error('Error fetching user data.');
    console.error(error);
  }
  if (response?.Item === undefined || response.Item === null) response = { Item: { uuid: token.value!.username, favourites: [] } };
  return response;
};

/**
 * Stores user data in the database.
 *
 * @param data - The user data to store.
 * @param cookies - The cookies object containing user session data.
 * @returns A promise that resolves to the result of the operation.
 */
const putUserData = async (data: Partial<UserData>, cookies: Cookies): Promise<Record<'ok', boolean>> => {
  let token: TokenResponse = await getToken(cookies);
  if (!token.ok) return { ok: false };
  data.uuid = token.value!.username;
  await docClient.send(
    new PutCommand({
      TableName: process.env.USER_TABLE_NAME,
      Item: data,
    })
  );
  return { ok: true };
};

export { getUserData, putUserData };
