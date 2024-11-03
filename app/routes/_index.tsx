import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "Backlog Attack" },
    { name: "description", content: "Need More Games!" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-start pt-24   justify-center">
      <div className="flex flex-col items-center gap-16">
        <header className="flex flex-col items-center gap-9">
          <h1 className="leading text-2xl font-bold text-gray-100">
            Welcome to
            <br />
            <span className="text-base md:text-4xl">BACKLOG ATTACK</span>
          </h1>
          <div className="h-[144px] w-[434px]"></div>
        </header>
      </div>
    </div>
  );
}
