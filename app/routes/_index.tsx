import { columns, Payment } from "~/components/columns";
import { DataTable } from "~/components/dataTable";
import { payments } from "~/dummyData";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
  Highlight,
  Hits,
  InstantSearch,
  PoweredBy,
  SearchBox,
} from "react-instantsearch";

const searchClient = algoliasearch(
  "BPN8TM6PX7",
  "a675de4ad17e090ea39d6022d0cf0847"
);

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

function Hit({ hit }: any) {
  return (
    <article>
      {/* <img src={hit.image} alt={hit.name} /> */}
      {/* <p>{hit.categories[0]}</p> */}
      <h1>
        <Highlight attribute="name" hit={hit} />
      </h1>
      <p>${hit.email}</p>
    </article>
  );
}

export default function Index() {
  const data: Payment[] = useLoaderData<typeof loader>();

  return (
    <div className="flex h-screen items-start pt-24   justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex items-center gap-9">
          <div className="star"></div>
          <h1 className="leading text-2xl font-bold text-gray-100">
            Welcome to
            <br />
            <span className="text-base md:text-4xl">BACKLOG ATTACK</span>
          </h1>
        </header>
        <div className="h-[144px] w-[434px]">
          <DataTable columns={columns} data={data} />
        </div>

        <InstantSearch
          searchClient={searchClient}
          indexName="dummydata"
          future={{ preserveSharedStateOnUnmount: true }}
        >
          <PoweredBy />
          <SearchBox />
          <Hits hitComponent={Hit} />
        </InstantSearch>
      </div>
    </div>
  );
}
