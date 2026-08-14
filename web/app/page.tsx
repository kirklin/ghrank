import { Title } from "~/components/Chrome";
import UserTable from "~/components/UserTable";
import { flag, nameMap } from "~/lib/countries";
import { countries, users } from "~/lib/data";
import RegionChips from "./RegionChips";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Home() {
  const all = users();
  const list = countries();
  const names = nameMap();

  return (
    <>
      <Title titleKey="home.title" />

      <RegionChips
        base={base}
        regions={list.slice(0, 12).map(c => ({
          code: c.code,
          count: c.count,
          flag: flag(c.code),
          name: names[c.code] ?? { en: c.code, zh: c.code },
        }))}
      />

      <UserTable
        rows={all.slice(0, 1000).map(u => ({ ...u, joined: Number(u.createdAt.slice(0, 4)) }))}
        total={all.length}
        fullUrl={`${base}/data/users.json`}
        countryNames={names}
      />
    </>
  );
}
