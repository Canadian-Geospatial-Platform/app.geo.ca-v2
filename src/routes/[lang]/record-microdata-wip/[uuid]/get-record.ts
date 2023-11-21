import { Bucket } from 'sst/node/bucket';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// This should point to the bucket containing geojson from the newest geocore transformation lambda with the improved schema.
const PREFIX = 'records/';
const s3Client = new S3Client({});

const getRecord = async (uuid) => {
	let key = PREFIX + uuid + '.geojson';
	// todo: error handling
	const { Body } = await s3Client.send(
		new GetObjectCommand({
			Bucket: Bucket.geocore.bucketName,
			Key: key
		})
	);
	return Body;
};
export { getRecord };
