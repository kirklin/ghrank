import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Title } from "~/components/Chrome";
import UserTable from "~/components/UserTable";
import { countryName, countryNameEn, flag } from "~/lib/countries";
import { countries, users } from "~/lib/data";

export function generateStaticParams() {
  return countries().map(c => ({ code: c.code.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const upper = code.toUpperCase();
  return {
    title: `Top GitHub Developers in ${countryNameEn(upper)} — ghrank`,
    description: `Developers in ${countryNameEn(upper)} ranked by GitHub followers, refreshed weekly.`,
  };
}

export default async function Country({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const rows = users()
    .filter(u => u.country === upper)
    .map((u, i) => ({ ...u, rank: i + 1, joined: Number(u.createdAt.slice(0, 4)) }));

  if (!rows.length) {
    notFound();
  }

  const cities = new Map<string, number>();
  for (const u of rows) {
    if (u.city) {
      cities.set(u.city, (cities.get(u.city) ?? 0) + 1);
    }
  }
  const facets = [...cities.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));

  return (
    <>
      <Title
        titleKey="country.title"
        prefix={flag(upper)}
        values={{ name: { en: countryNameEn(upper), zh: countryName(upper) } }}
      />
      <UserTable rows={rows} facets={facets} />
    </>
  );
}
