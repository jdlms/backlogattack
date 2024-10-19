/// <reference path="./.sst/platform/config.d.ts" />

import { Dynamo } from ".sst/platform/src/components/aws";

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
        img: "string",
        price: "string",
        lastUpdated: "number"
      },
      primaryIndex: { hashKey: "title", rangeKey: "itemKey" },
      localIndexes: {
        ImgIndex: { rangeKey: "img" },
        PriceIndex: { rangeKey: "price" },
        LastUpdatedIndex: { rangeKey: "lastUpdated" }
      },
      globalIndexes: {
        CreatedAtIndex: { hashKey: "itemKey", rangeKey: "title" }
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
            table.arn, // Dynamically links to your DynamoDB table's ARN
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
