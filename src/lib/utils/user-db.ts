import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const getUserData = async () => {
	const command = new GetCommand({
		TableName: 'users',
		Key: {
			userId: sessionStorage.getItem('id_token').parseJwtChainable()
		}
	});

	let response = null;
	try {
		response = await docClient.send(command);
	} catch (error) {
		console.error('Error fetching data in getUserData');
		console.error(error);
	}
	console.log(response);
	return response;
};

const putUserData = async (data) => {
	console.log('put user data received: \n', data);
	await docClient.send(
		new PutCommand({
			TableName: 'users',
			Item: data
		})
	);
};

export { getUserData, putUserData };
