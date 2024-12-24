import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";

import "./tailwind.css";
import SearchSelect from "./components/SearchSelect";
import { DataTable } from "~/components/dataTable";
import { payments } from "~/dummyData";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  DynamoDBClient,
  ListGlobalTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

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

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex flex-col container mx-auto pt-8 justify-center">
          <nav>
            <div className="flex flex-col items-center gap-6">
              <header className="flex items-center gap-3">
                <div className="starburst"></div>
                <h1 className="leading text-2xl font-bold text-gray-100">
                  {/* Welcome to
                    <br /> */}
                  <span className="text-base md:text-4xl">
                    BACKLOGATTACK<span className="text-sm">.wtf</span>
                  </span>
                </h1>
              </header>
              <div className=" w-[350px]">
                <SearchSelect data={data} />
              </div>
            </div>
          </nav>
          <div>{children}</div>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
