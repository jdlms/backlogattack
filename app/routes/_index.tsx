import { DataTable } from "~/components/dataTable";
import { payments } from "~/dummyData";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import SearchSelect from "~/components/SearchSelect";
import {
  DynamoDBClient,
  ListGlobalTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";

export const meta: MetaFunction = () => {
  return [
    { title: "Backlog Attack" },
    { name: "description", content: "Need More Games!" },
  ];
};

const client = new DynamoDBClient({ region: "eu-central-1" });

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const tableName = Resource.Titles.name;
    // const userDetails: UserDetails | null = await getUserDetails(request);

    // if (!userDetails?.email) {
    // 	throw new Response("User not authenticated", { status: 401 });
    // }

    const params: ScanCommandInput = {
      TableName: tableName,
    };

    const items = [];
    let ExclusiveStartKey;

    do {
      const command: ScanCommand = new ScanCommand({
        ...params,
        ExclusiveStartKey,
      });
      const response = await client.send(command);
      if (response.Items) items.push(...response.Items);
      ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    console.log(items);

    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json" },
    });

    // const files = await getTitles()
    // return json<Files>({ files }, { status: 200 });
  } catch (error) {
    console.error("Error fetching titles:", error);
    throw new Response("An error occurred while fetching data from DynamoDB.", {
      status: 500,
    });
  }
};

export default function Index() {
  // const data = useLoaderData<typeof loader>();

  return (
    <div>
      <p className="text-white">test</p>
    </div>
  );
}
