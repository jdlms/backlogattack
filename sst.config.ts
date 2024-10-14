/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "backlogattack",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Remix("MyWeb");

    const api = new sst.aws.Function("Puppeteer", {
      url: true,
      memory: "2 GB",
      timeout: "15 minutes",
      handler: "package/functions/topsellers.handler",
      nodejs: {
        install: ["@sparticuz/chromium"],
      },
    });

    return {
      url: api.url,
    };
  },
});
