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
      const USER_TABLE = new Table(stack, "users", {
        fields: { uuid: "string" },
        primaryIndex: { partitionKey: "uuid" },
      });

      /*** Other Resources ***/
      const FEATURE_SIGN_IN = new Config.Parameter(stack, "FEATURE_SIGN_IN", {
        value: "true",
      });

      const VITE_GEOCORE_API_DOMAIN = new Config.Parameter(stack, "VITE_GEOCORE_API_DOMAIN", {
        value: "https://geocore.api.geo.ca",
      });

      const VITE_SEMANTIC_SEARCH_URL = new Config.Parameter(stack, "VITE_SEMANTIC_SEARCH_URL", {
        value: "https://search-recherche.geocore.api.geo.ca",
      });

      const VITE_OIDC_CUSTOM_DOMAIN = new Config.Parameter(stack, "VITE_OIDC_CUSTOM_DOMAIN", {
        value: "https://cds-gcsignin-test.verify.ibm.com",
      });

      const VITE_OIDC_CLIENT_ID = new Config.Parameter(stack, "VITE_OIDC_CLIENT_ID", {
        value: "cb802d19-a800-4433-ba7e-369d8ab58604",
      });

      const OIDC_CLIENT_SECRET = new Config.Secret(stack, "OIDC_CLIENT_SECRET");

      const site = new SvelteKitSite(stack, "site", {
        path: "packages/web-app/",
        bind: [
          USER_TABLE,
          FEATURE_SIGN_IN,
          OIDC_CLIENT_SECRET,
          VITE_GEOCORE_API_DOMAIN,
          VITE_SEMANTIC_SEARCH_URL,
          VITE_OIDC_CUSTOM_DOMAIN,
          VITE_OIDC_CLIENT_ID,
        ],
      });

      stack.addOutputs({
        url: site.url,
      });
    });
  },
} satisfies SSTConfig;
