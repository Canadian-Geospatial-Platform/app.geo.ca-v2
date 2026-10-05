import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { GeospatialRecord } from './db-types';
import { GEOCORE_RECORD_PREFIX } from '$lib/config/constants';
import { getAwsRegion } from '$lib/utils/aws-region';

// Configuration constants
const BUCKET_NAME = process.env.VITE_BUCKET_NAME || process.env.BUCKET_NAME;

function getBucketName(): string {
  if (!BUCKET_NAME) {
    throw new Error('Environment variable BUCKET_NAME is not set');
  }

  return BUCKET_NAME;
}

const s3Client = new S3Client({ region: getAwsRegion() });

/**
 * Retrieves a record from the S3 bucket based on the provided UUID.
 *
 * @param uuid The unique identifier for the record.
 * @returns A promise that resolves to the record data.
 * @throws {Error} If the record cannot be retrieved.
 */
const getRecord = async (uuid: string): Promise<GeospatialRecord> => {
  const key = `${GEOCORE_RECORD_PREFIX}${uuid}.geojson`;
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })
  );

  if (!response.Body) {
    throw new Error('No body in S3 response');
  }

  // Convert the stream to a string
  const bodyString = await response.Body.transformToString();

  // Parse and return the JSON
  return JSON.parse(bodyString) as GeospatialRecord;
};
export { getRecord };
