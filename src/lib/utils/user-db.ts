import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { parseJwt } from '$lib/utils/parse-jwt';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getUserData = async (cookies) => {
	let userId;
	try {
		userId = parseJwt(cookies.get('id_token')).identities[0].userId;
	} catch (error) {
		console.error(
			'Error fetching user id. User might not be logged in. Returning empty result set.'
		);
		return { Item: { uuid: null, mapCart: [] } };
	}
	const command = new GetCommand({
		TableName: Table.users.tableName,
		Key: {
			uuid: userId
		}
	});

	let response;
	try {
		response = await docClient.send(command);
	} catch (error) {
		console.error('Error fetching user data.');
		console.error(error);
	}
	if (response.Item == undefined) response = { Item: { uuid: userId, mapCart: [] } };
	console.log('userdatais:\n', response);
	return response;
};

const putUserData = async (data) => {
	console.log('put user data received: \n', data);
	await docClient.send(
		new PutCommand({
			TableName: Table.users.tableName,
			Item: data
		})
	);
};

export { getUserData, putUserData };
