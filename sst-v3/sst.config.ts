/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "app-geo-ca",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    $transform(aws.cloudwatch.LogGroup, (args, opts) => {
      opts.retainOnDelete = true;
    });

    const infra = await import("./infra");

    const GEOCORE_API_DOMAIN = $app.stage !== "prod"
      ? "https://geocore.api.geo.ca"
      : "https://geocore.api.geo.ca";

    const site = new sst.aws.SvelteKit("WebApp", {
      path: "packages/web-app/",
      link: [infra.userTable, infra.dataLake],
      environment: {
        GEOCORE_API_DOMAIN
      }
    });

    return {
      site: site
    };
  },
});
