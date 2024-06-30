import { Resource } from "sst";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import fetch from "node-fetch";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = Resource.Steam.name;

function* chunkArray(
  array: { appi: number; name: string }[],
  chunkSize: number
) {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

const fetchData = async () => {
  try {
    const response = await fetch(
      "http://api.steampowered.com/ISteamApps/GetAppList/v0002/?key=STEAMKEY&format=json'"
    );
    const data = await response.json();

    const dataChunks = chunkArray(data.applist.apps, 25);

    for (const chunk of dataChunks) {
      const putRequests = chunk.map((item) => ({
        PutRequest: {
          appid: { N: item.appi.toString() },
          name: { S: item.name },
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [tableName]: putRequests,
        },
      });
      await docClient.send(command);
    }
  } catch (error) {
    console.error(
      "Error fetching data or writing to DynamoDB:",
      error
    );
  }
};

export const handler = async () => {
  await fetchData();
};
