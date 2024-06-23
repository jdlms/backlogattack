import {
  DynamoDBClient,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import fetch from "node-fetch";
import { Resource } from "sst";

const dynamoClient = new DynamoDBClient();
const tableName = Resource.Steam.name;
console.log({ tableName });
const fetchData = async () => {
  try {
    // const response = await fetch(
    //   "URL_TO_FETCH_JSON_OBJECT"
    // );
    // const data = await response.json();

    // for (const item of data) {
    const params = {
      TableName: tableName,
      Item: {
        // appid: { S: item.appid },
        // name: { S: item.name },
        appid: { S: "one" },
        name: { S: "test" },
      },
    };

    const command = new PutItemCommand(params);
    await dynamoClient.send(command);
    // }
  } catch (error) {
    console.error(error);
  }
};

export const handler = async (event) => {
  await fetchData();
};
