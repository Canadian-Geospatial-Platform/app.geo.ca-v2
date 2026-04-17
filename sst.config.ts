/// <reference path="./.sst/platform/config.d.ts" />

const GEOCORE_API_DOMAIN = "https://geocore.api.geo.ca";
const SEMANTIC_SEARCH_URL = "https://search-recherche.geocore.api.geo.ca";

export default $config({
  app(input) {
    return {
      name: "app-geo-ca-v2",
      home: "aws",
      providers: {
        aws: {
          region: "ca-central-1",
        },
      },
      removal: input.stage === "production" ? "retain" : "remove",
      protect: input.stage === "production",
    };
  },

  async run() {
    const userTableName = `${$app.stage}-app-geo-ca-v2-users`;

    // Production keeps using the existing table to avoid accidental replacement.
    const users =
      $app.stage === "production"
        ? sst.aws.Dynamo.get("Users", userTableName)
        : new sst.aws.Dynamo("Users", {
            fields: {
              uuid: "string",
            },
            primaryIndex: {
              hashKey: "uuid",
            },
          });

    const site = new sst.aws.SvelteKit("WebApp", {
      path: "packages/web-app",
      link: [users],
      environment: {
        GEOCORE_API_DOMAIN,
        SEMANTIC_SEARCH_URL,
        USER_TABLE_NAME: users.name,
      },
    });

    return {
      url: site.url,
      userTableName,
    };
  },
});
