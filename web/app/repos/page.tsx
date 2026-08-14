import type { Metadata } from "next";
import { Title } from "~/components/Chrome";
import RepoTable from "~/components/RepoTable";
import { languages, languageSlug, repos } from "~/lib/data";
import LanguageChips from "./LanguageChips";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Most Starred GitHub Repositories — ghrank",
  description: "Every GitHub repository with over 2,000 stars, ranked and refreshed weekly.",
};

export default function Repos() {
  const all = repos();

  return (
    <>
      <Title titleKey="repos.title" />

      <LanguageChips
        base={base}
        languages={languages().slice(0, 12).map(l => ({
          name: l.name,
          slug: languageSlug(l.name),
          count: l.count,
        }))}
      />

      <RepoTable
        rows={all.slice(0, 1000).map(r => ({ ...r, pushed: r.pushedAt.slice(0, 10) }))}
        total={all.length}
        fullUrl={`${base}/data/repos.json`}
      />
    </>
  );
}
