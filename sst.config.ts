import type { SSTConfig } from "sst";
import { SvelteKitSite, Config, Bucket, Table, Function } from "sst/constructs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

async function getExistingUserTableArn(tableName: string, region: string) {
  const dynamoDBClient = new DynamoDBClient({ region });
  try {
    const response = await dynamoDBClient.send(new DescribeTableCommand({ TableName: tableName }));
    return response.Table?.TableArn;
  } catch (error) {
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
  async stacks(app) {
    const tableName = `${app.stage}-app-geo-ca-v2-users`;
    const existingUserTableArn = await getExistingUserTableArn(tableName, app.region);

    app.stack(function Site({ stack }) {
      /*** User Table ***/

      // Check if an existing user table exists. If it does, use it instead of
      // creating a new one.
      const USER_TABLE = existingUserTableArn
        ? dynamodb.Table.fromTableArn(stack, "users", existingUserTableArn)
        : new Table(stack, "users", {
          fields: { uuid: "string" },
          primaryIndex: { partitionKey: "uuid" },
        });

      /*** Other Resources ***/
      const OIDC_CLIENT_ID = new Config.Parameter(stack, "OIDC_CLIENT_ID", {
        value: process.env.OIDC_CLIENT_ID,
      });
      const COGNITO_USERPOOL_ID = new Config.Parameter(stack, "COGNITO_USERPOOL_ID", {
        value: process.env.COGNITO_USERPOOL_ID,
      });
      const OIDC_CLIENT_SECRET = new Config.Secret(stack, "OIDC_CLIENT_SECRET");
      const OIDC_CUSTOM_DOMAIN = new Config.Parameter(stack, "OIDC_CUSTOM_DOMAIN", {
        value: process.env.OIDC_CUSTOM_DOMAIN,
      });
      const GEOCORE_API_DOMAIN = new Config.Parameter(stack, "GEOCORE_API_DOMAIN", {
        value: process.env.GEOCORE_API_DOMAIN,
      });
      const SEMANTIC_SEARCH_URL = new Config.Parameter(stack, "SEMANTIC_SEARCH_URL", {
        value: process.env.SEMANTIC_SEARCH_URL,
      });
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
        bind: [
          OIDC_CLIENT_ID,
          COGNITO_USERPOOL_ID,
          OIDC_CLIENT_SECRET,
          OIDC_CUSTOM_DOMAIN,
          GEOCORE_API_DOMAIN,
          SEMANTIC_SEARCH_URL,
          userTableConfig,
          FEATURE_SIGN_IN,
        ],
      });

      stack.addOutputs({
        url: site.url,
      });
    });
  },
} satisfies SSTConfig;
