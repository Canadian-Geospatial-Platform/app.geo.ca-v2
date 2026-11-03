import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { getAwsRegion } from '#lib/utils/aws-region.js';
import type { RequestHandler } from './$types';

/**
 * Lightweight DB diagnostics endpoint for local/non-production debugging.
 *
 * Returns whether the users table is configured and reachable with current
 * runtime credentials. Disabled in production.
 */
export const GET: RequestHandler = async (): Promise<Response> => {
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  if (!process.env.USER_TABLE_NAME) {
    return Response.json(
      {
        ok: false,
        tableConfigured: false,
        tableAccessible: false,
        error: 'USER_TABLE_NAME is not configured in runtime environment',
      },
      { status: 500 }
    );
  }

  const awsRegion = getAwsRegion();
  const client = new DynamoDBClient({ region: awsRegion });

  try {
    const result = await client.send(
      new DescribeTableCommand({
        TableName: process.env.USER_TABLE_NAME,
      })
    );

    return Response.json({
      ok: true,
      tableConfigured: true,
      tableAccessible: true,
      region: awsRegion,
      tableName: process.env.USER_TABLE_NAME,
      tableStatus: result.Table?.TableStatus ?? null,
      tableArn: result.Table?.TableArn ?? null,
    });
  } catch (error) {
    const err = error as { name?: string; message?: string };
    return Response.json(
      {
        ok: false,
        tableConfigured: true,
        tableAccessible: false,
        region: awsRegion,
        tableName: process.env.USER_TABLE_NAME,
        errorName: err.name ?? 'UnknownError',
        errorMessage: err.message ?? 'Unknown DynamoDB access error',
      },
      { status: 500 }
    );
  }
};
