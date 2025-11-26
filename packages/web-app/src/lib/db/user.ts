import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getToken } from '$lib/utils/parse-jwt';
import { Config } from "sst/node/config";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = Config.USER_TABLE_NAME; // Comes from your SST binding

const getUserData = async (cookies) => {
	let token = await getToken(cookies);
	if (!token.ok) return { Item: { uuid: null, favourites: [] } };
	const command = new GetCommand({
		TableName: tableName,
		Key: {
			uuid: token.value.username
		}
	});

	let response;
	try {
		response = await docClient.send(command);
	} catch (error) {
		console.error('Error fetching user data.');
		console.error(error);
	}
	if (response.Item == undefined)
		response = { Item: { uuid: token.value.username, favourites: [] } };
	return response;
};

const putUserData = async (data: Object, cookies) => {
	let token = await getToken(cookies);
	if (!token.ok) return { ok: false };
	data.uuid = token.value.username;
	await docClient.send(
		new PutCommand({
			TableName: Table.users.tableName,
			Item: data
		})
	);
	return { ok: true };
};

export { getUserData, putUserData };
