import type { SSTConfig } from "sst";
import { SvelteKitSite, Config, Table } from "sst/constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const GEOCORE_API_DOMAIN = "https://geocore.api.geo.ca";
const SEMANTIC_SEARCH_URL = "https://search-recherche.geocore.api.geo.ca";
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;
const OIDC_CUSTOM_DOMAIN = process.env.OIDC_CUSTOM_DOMAIN;

/**
 * Gets the ARN of an existing DynamoDB table if it exists.
 *
 * @param tableName The name of the DynamoDB table.
 * @param region The AWS region where the table is located.
 * @returns The ARN of the existing DynamoDB table, or undefined if the table does not exist.
 */
async function getExistingUserTableArn(
  tableName: string,
  region: string,
): Promise<string | undefined> {
  const dynamoDBClient = new DynamoDBClient({ region });
  try {
    const response = await dynamoDBClient.send(
      new DescribeTableCommand({ TableName: tableName }),
    );
    return response.Table?.TableArn;
  } catch (error: any) {
    if (error.name !== "ResourceNotFoundException") {
      throw error;
    }
    return undefined; // If the table doesn't exist, return undefined
  }
}

export default {
  config(_input) {
    return {
      name: "app-geo-ca-v2",
      region: "ca-central-1",
    };
  },

  /**
   * Defines the stacks for the application.
   *
   * @param app The SST app instance.
   */
  async stacks(app): Promise<void> {
    const tableName = `${app.stage}-app-geo-ca-v2-users`;
    const existingUserTableArn = await getExistingUserTableArn(
      tableName,
      app.region,
    );

    app.stack(function Site({ stack }) {
      const OIDC_CLIENT_SECRET = new Config.Secret(stack, "OIDC_CLIENT_SECRET");
      /*** User Table ***/

      // Check if an existing user table exists. If it does, use it instead of creating a new one.
      const USER_TABLE = existingUserTableArn
        ? dynamodb.Table.fromTableArn(stack, "users", existingUserTableArn)
        : new Table(stack, "users", {
            fields: { uuid: "string" },
            primaryIndex: { partitionKey: "uuid" },
          });

      /*** Other Resources ***/
      const FEATURE_SIGN_IN = new Config.Parameter(stack, "FEATURE_SIGN_IN", {
        value: "false",
      });

      // Wrap the user table in SST’s Config.Parameter so that it can be referenced in SST functions
      // This is necessary when an existing table is imported using the Table.fromTableArn method
      const userTableConfig = new Config.Parameter(stack, "USER_TABLE_NAME", {
        value: tableName,
      });

      const site = new SvelteKitSite(stack, "site", {
        path: "packages/web-app/",
        bind: [userTableConfig, FEATURE_SIGN_IN, OIDC_CLIENT_SECRET],
        environment: {
          GEOCORE_API_DOMAIN,
          SEMANTIC_SEARCH_URL,
        },
      });

      stack.addOutputs({
        url: site.url,
      });
    });
  },
} satisfies SSTConfig;
