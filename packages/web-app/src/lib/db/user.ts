import { Table } from 'sst/node/table';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { getToken } from '$lib/utils/sign-in';
import { Config } from 'sst/node/config';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Lazy getter for table name to avoid accessing bound resources at module load time
const getTableName = () => {
	try {
		return Table.users.tableName;
	} catch (error) {
		console.warn('Table binding not available, using environment variable');
		return process.env.SST_Table_tableName_users || 'dev-app-geo-ca-v2-users';
	}
};

const getUserData = async (cookies) => {
	console.log('getting user data');
	let token = await getToken(cookies);
	if (!token.ok) {
		console.log('token not ok, returning default value');
		return { Item: { uuid: null, favourites: [] } };
	}
	const command = new GetCommand({
		TableName: getTableName(),
		Key: {
			uuid: token.value.sub
		}
	});

	let response;
	try {
		response = await docClient.send(command);
	} catch (error) {
		console.error('Error fetching user data.');
		console.error(error);
	}
	if (response?.Item == undefined) {
		console.log('response.Item was undefined', response);
		response = { Item: { uuid: token.value.sub, favourites: [] } };
	}
	return response;
};

const putUserData = async (data: Object, cookies) => {
	let token = await getToken(cookies);
	if (!token.ok) return { ok: false };
	data.uuid = token.value.sub;
	await docClient.send(
		new PutCommand({
			TableName: getTableName(),
			Item: data
		})
	);
	return { ok: true };
};

export { getUserData, putUserData };
