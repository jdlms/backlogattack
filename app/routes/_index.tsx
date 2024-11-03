import { columns, Payment } from "~/components/columns";
import { DataTable } from "~/components/dataTable";
import { payments } from "~/dummyData";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Backlog Attack" },
    { name: "description", content: "Need More Games!" },
  ];
};

export async function loader(): Promise<Payment[]> {
  let data: Payment[] = payments;
  return data;
}

export default function Index() {
  const data: Payment[] = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen items-start pt-24   justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="leading text-2xl font-bold text-gray-100">
            Welcome to
            <br />
            <span className="text-base md:text-4xl">BACKLOG ATTACK</span>
          </h1>
          <div className="h-[144px] w-[434px]">
            <DataTable columns={columns} data={data} />
          </div>
        </header>
      </div>
    </div>
  );
}
