import { Resource } from 'sst';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// This should point to the bucket containing geojson from the newest geocore transformation lambda with the improved schema.
const PREFIX = 'records/';
const s3Client = new S3Client({});

const getRecord = async (uuid) => {
	let key = PREFIX + uuid + '.geojson';
	return new Promise(async (resolve, reject) => {
		try {
			const { Body } = await s3Client.send(
				new GetObjectCommand({
					Bucket: Ressource.DataLake.bucketName,
					Key: key
				})
			);
			// Store all of data chunks returned from the response data stream
			// into an array then use Array#join() to use the returned contents as a String
			let responseDataChunks = [];

			// Handle an error while streaming the response body
			Body.once('error', (err) => reject(err));

			// Attach a 'data' listener to add the chunks of data to our array
			// Each chunk is a Buffer instance
			Body.on('data', (chunk) => responseDataChunks.push(chunk));

			// Once the stream has no more data, join the chunks into a string and return the string
			Body.once('end', () => resolve(JSON.parse(responseDataChunks.join(''))));
		} catch (err) {
			// Handle the error or throw
			return reject(err);
		}
	});
};
export { getRecord };
