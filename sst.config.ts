// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "backlogattack",
      removal:
        input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "eu-central-1",
        },
      },
    };
  },
  async run() {
    const steamTable = new sst.aws.Dynamo("Steam", {
      fields: {
        appid: "string",
        name: "string",
      },
      primaryIndex: {
        hashKey: "appid",
        rangeKey: "name",
      },
    });

    const allTitles = new sst.aws.Function("AllTitles", {
      handler: "lib/allTitles.handler",
      nodejs: {
        install: ["node-fetch", "@aws-sdk/client-dynamodb"],
      },
      environment: {
        TABLE_NAME: steamTable.name,
      },
      link: [steamTable],
    });

    new sst.aws.Remix("Backlogattack", {
      link: [steamTable, allTitles],
    });
  },
});
