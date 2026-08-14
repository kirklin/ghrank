import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Title } from "~/components/Chrome";
import RepoTable from "~/components/RepoTable";
import { languages, languageSlug, repos } from "~/lib/data";

const CAP = 1000;

export function generateStaticParams() {
  return languages().map(l => ({ slug: languageSlug(l.name) }));
}

function nameOf(slug: string): string | null {
  return languages().find(l => languageSlug(l.name) === slug)?.name ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = nameOf(slug) ?? slug;
  return {
    title: `Most Starred ${name} Repositories — ghrank`,
    description: `The most starred ${name} repositories on GitHub, refreshed weekly.`,
  };
}

export default async function Language({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = nameOf(slug);
  if (!name) {
    notFound();
  }

  const all = repos()
    .filter(r => r.language === name)
    .map((r, i) => ({ ...r, rank: i + 1, pushed: r.pushedAt.slice(0, 10) }));

  return (
    <>
      <Title titleKey="lang.title" values={{ name }} />
      <RepoTable rows={all.slice(0, CAP)} total={all.length} showLanguage={false} />
    </>
  );
}
