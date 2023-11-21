import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getToken } from '$lib/utils/parse-jwt';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getUserData = async (cookies) => {
	let token = await getToken(cookies);
	if (!token.ok) return { Item: { uuid: null, mapCart: [] } };
	const command = new GetCommand({
		TableName: Table.users.tableName,
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
	if (response.Item == undefined) response = { Item: { uuid: token.value.username, mapCart: [] } };
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
