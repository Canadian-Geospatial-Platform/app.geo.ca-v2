import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { USER_TABLE_NAME } from '$env/static/private';
import { json } from '@sveltejs/kit';
import { getAwsRegion } from '$lib/utils/aws-region';
import type { RequestHandler } from './$types';

/**
 * Lightweight DB diagnostics endpoint for local/non-production debugging.
 *
 * Returns whether the users table is configured and reachable with current
 * runtime credentials. Disabled in production.
 */
export const GET: RequestHandler = async (): Promise<Response> => {
  if (process.env.NODE_ENV === 'production') {
    return json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  if (!USER_TABLE_NAME) {
    return json(
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
        TableName: USER_TABLE_NAME,
      })
    );

    return json({
      ok: true,
      tableConfigured: true,
      tableAccessible: true,
      region: awsRegion,
      tableName: USER_TABLE_NAME,
      tableStatus: result.Table?.TableStatus ?? null,
      tableArn: result.Table?.TableArn ?? null,
    });
  } catch (error) {
    const err = error as { name?: string; message?: string };
    return json(
      {
        ok: false,
        tableConfigured: true,
        tableAccessible: false,
        region: awsRegion,
        tableName: USER_TABLE_NAME,
        errorName: err.name ?? 'UnknownError',
        errorMessage: err.message ?? 'Unknown DynamoDB access error',
      },
      { status: 500 }
    );
  }
};
