import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { GeospatialRecord } from './db-types';

// TODO: Move constants like bucket name and prefix to a config file or environment variables
// This should point to the bucket containing geojson from the newest geocore transformation lambda with the improved schema.
const PREFIX = 'geocore/';
const BUCKET_NAME = process.env.BUCKET_NAME || '';
const s3Client = new S3Client({ region: 'ca-central-1' });

/**
 * Retrieves a record from the S3 bucket based on the provided UUID.
 *
 * @param uuid The unique identifier for the record.
 * @returns A promise that resolves to the record data.
 * @throws {Error} If the record cannot be retrieved.
 */
const getRecord = async (uuid: string): Promise<GeospatialRecord> => {
	let key = PREFIX + uuid + '.geojson';
	try {
		const response = await s3Client.send(
			new GetObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key
			})
		);

		if (!response.Body) {
			throw new Error('No body in S3 response');
		}

		// Convert the stream to a string
		const bodyString = await response.Body.transformToString();

		// Parse and return the JSON
		return JSON.parse(bodyString) as GeospatialRecord;
	} catch (err) {
		// Handle the error or throw
		throw err;
	}
};
export { getRecord };
