const GEOCORE_API_DOMAIN = "https://geocore.api.geo.ca";
const SEMANTIC_SEARCH_URL = "https://search-recherche.geocore.api.geo.ca";
const AWS_REGION = "ca-central-1";

// Environment variables with defaults
const env = {
  oidcClientId: process.env.OIDC_CLIENT_ID ?? "",
  oidcCustomDomain: process.env.OIDC_CUSTOM_DOMAIN ?? "",
  oidcTokenEndpoint: process.env.OIDC_TOKEN_ENDPOINT ?? "",
  oidcJwtKid: process.env.OIDC_JWT_KID ?? "",
  oidcClientSecret: process.env.OIDC_CLIENT_SECRET ?? "",
  oidcPrivateKeySecretId: process.env.OIDC_PRIVATE_KEY_SECRET_ID ?? "",
  oidcRequestedScopes: process.env.OIDC_REQUESTED_SCOPES ?? "",
};

// Logging configuration for long-running functions
const logRetention = { retention: "1 week" } as const;

export default $config({
  app(input) {
    return {
      name: "app-geo-ca-v2",
      home: "aws",
      providers: {
        aws: {
          region: AWS_REGION,
        },
      },
      removal: input.stage === "production" ? "retain" : "remove",
      protect: input.stage === "production",
    };
  },

  async run() {
    const { toSecretsManagerResourceArn } =
      await import("./config/secrets-manager-policy");
    const isProduction = $app.stage === "production";
    const isStaging = $app.stage === "staging";
    const usePrivateKeyJwt =
      isStaging ||
      isProduction ||
      (process.env.OIDC_USE_PRIVATE_KEY_JWT ?? "").toLowerCase() === "true";
    const oidcPrivateKeySecretResourceArn = toSecretsManagerResourceArn(
      env.oidcPrivateKeySecretId,
      AWS_REGION,
    );

    if (usePrivateKeyJwt && !oidcPrivateKeySecretResourceArn) {
      throw new Error(
        `OIDC_PRIVATE_KEY_SECRET_ID is required and must be a valid secret name/id or ARN for stage '${$app.stage}' when private_key_jwt is enforced.`,
      );
    }

    const resourcePrefix = `${$app.stage}-app-geo-ca-v2`;
    const userTableName = `${resourcePrefix}-users`;
    const bucketName = `${resourcePrefix}-hnap`;

    // Production keeps using the existing table to avoid accidental replacement.
    const users = isProduction
      ? sst.aws.Dynamo.get("Users", userTableName)
      : new sst.aws.Dynamo("Users", {
          fields: {
            uuid: "string",
          },
          primaryIndex: {
            hashKey: "uuid",
          },
        });

    // Bucket holding HNAP and geocore geojson records.
    // Production keeps using the existing bucket to avoid accidental replacement.
    const hnapBucket = isProduction
      ? sst.aws.Bucket.get("HnapBucket", bucketName)
      : new sst.aws.Bucket("HnapBucket", {
          transform: {
            bucket: (args: any) => {
              args.forceDestroy = true;
            },
          },
        });

    // TODO: restore hnap-bridge Lambda trigger (packages/hnap-bridge removed).
    // When the handler is added back, attach an S3 notification on hnapBucket
    // for the "hnap/" prefix that feeds the geocore transformation pipeline.

    const site = new sst.aws.SvelteKit("WebApp", {
      path: "packages/web-app",
      link: [users, hnapBucket],
      permissions: oidcPrivateKeySecretResourceArn
        ? [
            {
              actions: ["secretsmanager:GetSecretValue"],
              resources: [oidcPrivateKeySecretResourceArn],
            },
          ]
        : [],
      transform: {
        server: (args: any) => {
          args.logging = logRetention;
        },
        imageOptimizer: (args: any) => {
          args.logging = logRetention;
        },
      },
      environment: {
        GEOCORE_API_DOMAIN,
        SEMANTIC_SEARCH_URL,
        OIDC_CLIENT_ID: env.oidcClientId,
        OIDC_CUSTOM_DOMAIN: env.oidcCustomDomain,
        OIDC_TOKEN_ENDPOINT: env.oidcTokenEndpoint,
        OIDC_JWT_KID: env.oidcJwtKid,
        OIDC_CLIENT_SECRET: env.oidcClientSecret,
        OIDC_PRIVATE_KEY_SECRET_ID: env.oidcPrivateKeySecretId,
        OIDC_REQUESTED_SCOPES: env.oidcRequestedScopes,
        OIDC_USE_PRIVATE_KEY_JWT: String(usePrivateKeyJwt),
        USER_TABLE_NAME: users.name,
        BUCKET_NAME: hnapBucket.name,
      },
    });
  },
});
