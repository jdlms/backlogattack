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
    const table = new sst.aws.Dynamo("Titles", {
      fields: {
        itemKey: "string",
        title: "string",
      },
      primaryIndex: {
        hashKey: "title",
        rangeKey: "itemKey"
      },
      globalIndexes: {
        ItemKeyIndex: {
          hashKey: "itemKey",
          rangeKey: "title"
        }
      },
      transform: {
        table: {
          billingMode: 'PAY_PER_REQUEST',
          deletionProtectionEnabled: true,
          // pointInTimeRecovery: {
          //   enabled: false
          // }
        }
      }
    });



    const api = new sst.aws.Function("Puppeteer", {
      url: true,
      memory: "2 GB",
      timeout: "15 minutes",
      handler: "package/functions/topsellers.handler",
      nodejs: {
        install: ["@sparticuz/chromium"],
      },
      permissions: [
        {
          actions: ["dynamodb:BatchWriteItem", "dynamodb:PutItem"], resources: [
            table.arn,
          ],
        },
      ],
      link: [table]
    });



    new sst.aws.Remix("MyWeb", {
      link: [table]
    });
    return {
      url: api.url,
    };
  },
});
