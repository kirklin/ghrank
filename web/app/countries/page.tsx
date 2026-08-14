import type { Metadata } from "next";
import { Title } from "~/components/Chrome";
import { flag, nameMap } from "~/lib/countries";
import { countries } from "~/lib/data";
import RegionList from "./RegionList";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "GitHub Developers by Region — ghrank",
  description: "Top GitHub developers by country and territory, refreshed weekly.",
  alternates: { canonical: "/countries/" },
};

export default function Countries() {
  const names = nameMap();
  const list = countries().map(c => ({
    code: c.code,
    count: c.count,
    flag: flag(c.code),
    name: names[c.code] ?? { en: c.code, zh: c.code },
  }));

  return (
    <>
      <Title titleKey="countries.title" />
      <RegionList base={base} regions={list} />
    </>
  );
}
