import { columns, Payment } from "~/components/columns";
import { DataTable } from "~/components/dataTable";
import { payments } from "~/dummyData";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import SearchSelect from "~/components/SearchSelect";

export const meta: MetaFunction = () => {
  return [
    { title: "Backlog Attack" },
    { name: "description", content: "Need More Games!" },
  ];
};



export interface Option {
  value: string;
  label: string;
}

const options: Option[] = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "grape", label: "Grape" },
  { value: "orange", label: "Orange" },
  { value: "pineapple", label: "Pineapple" },
];

export const loader: LoaderFunction = async ({ request }) => {
	// const userDetails: UserDetails | null = await getUserDetails(request);

	// if (!userDetails?.email) {
	// 	throw new Response("User not authenticated", { status: 401 });
	// }

	try {
		const files = await getTitles()
		return json<Files>({ files }, { status: 200 });
	} catch (error) {
		console.error("Error fetching outbox files for user:", error);
		throw new Response("An error occurred while fetching data from DynamoDB.", {
			status: 500,
		});
	}
};

export default function Index() {
  const data: = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen items-start pt-24   justify-center">
      <div className="flex flex-col items-center gap-6">
        <header className="flex items-center gap-3">
          <div className="star"></div>
          <h1 className="leading text-2xl font-bold text-gray-100">
            Welcome to
            <br />
            <span className="text-base md:text-4xl">
              BACKLOGATTACK<span className="text-xs">.wtf</span>
            </span>
          </h1>
        </header>
        <div className="h-[144px] w-[434px]">
          <SearchSelect data={options} />
        </div>
      </div>
    </div>
  );
}
