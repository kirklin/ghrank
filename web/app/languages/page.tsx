import type { Metadata } from "next";
import { Title } from "~/components/Chrome";
import { languages, languageSlug } from "~/lib/data";
import LanguageList from "./LanguageList";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "GitHub Repositories by Language — ghrank",
  description: "The most starred open source repositories in each programming language.",
  alternates: { canonical: "/languages/" },
};

export default function Languages() {
  const list = languages().map(l => ({
    name: l.name,
    slug: languageSlug(l.name),
    count: l.count,
  }));

  return (
    <>
      <Title titleKey="languages.title" />
      <LanguageList base={base} languages={list} />
    </>
  );
}
