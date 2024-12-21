import {
  InstantSearch,
  Configure,
  useSearchBox,
  useHits,
} from "react-instantsearch";
import { liteClient as algoliasearch } from "algoliasearch/lite";

const searchClient = algoliasearch(
  "BPN8TM6PX7",
  "a675de4ad17e090ea39d6022d0cf0847"
);

export default function SearchPage() {
  return (
    <InstantSearch searchClient={searchClient} indexName="dummydata">
      <Configure hitsPerPage={5} />
      <div className="autocomplete">
        <SearchBox />
        <Suggestions />
      </div>
    </InstantSearch>
  );
}

function SearchBox() {
  const { query, refine } = useSearchBox();
  return (
    <input
      type="search"
      value={query}
      onChange={(e) => refine(e.target.value)}
      placeholder="Type to search..."
    />
  );
}

function Suggestions() {
  const { query } = useSearchBox();
  const { hits } = useHits();

  if (!query) return null; // no query, no results
  if (!hits.length) return null;

  return (
    <ul>
      {hits.map((hit, index) => {
        const name = (hit as any).email || "No name found";
        return <li key={index}>{name}</li>;
      })}
    </ul>
  );
}
