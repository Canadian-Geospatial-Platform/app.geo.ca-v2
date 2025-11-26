import type { SSTConfig } from "sst";
import { SvelteKitSite, Config, Bucket, Table, Function } from "sst/constructs";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";

const VITE_GEOCORE_API_DOMAIN = "https://geocore.api.geo.ca"
const VITE_SEMANTIC_SEARCH_URL = "https://search-recherche.geocore.api.geo.ca"
const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || "";
const OIDC_HOST_CERTIFICATE = process.env.OIDC_HOST_CERTIFICATE || "";
const OIDC_CUSTOM_DOMAIN = process.env.OIDC_CUSTOM_DOMAIN || "";

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
      const OIDC_CLIENT_SECRET = new Config.Secret(stack, "OIDC_CLIENT_SECRET");
      /*** User Table ***/

      // Check if an existing user table exists. If it does, use it instead of
      // creating a new one.
      const USER_TABLE = new Table(stack, "users", {
        fields: { uuid: "string" },
        primaryIndex: { partitionKey: "uuid" },
      });

      /*** Other Resources ***/
      const FEATURE_SIGN_IN = new Config.Parameter(stack, "FEATURE_SIGN_IN", {
        value: "false",
      });

      const site = new SvelteKitSite(stack, "site", {
        path: "packages/web-app/",
        bind: [
          USER_TABLE,
          FEATURE_SIGN_IN,
          OIDC_CLIENT_SECRET
        ],
        environment: {
          VITE_GEOCORE_API_DOMAIN,
          VITE_SEMANTIC_SEARCH_URL,
          OIDC_CLIENT_ID,
          OIDC_HOST_CERTIFICATE,
          OIDC_CUSTOM_DOMAIN
        }
      });

      stack.addOutputs({
        url: site.url,
      });
    });
  },
} satisfies SSTConfig;
