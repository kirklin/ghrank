"use client";

import { ArrowRight } from "lucide-react";
import { LangMark } from "~/components/Lang";
import { useLang } from "~/components/LangProvider";

export default function LanguageChips({
  base,
  languages,
}: {
  base: string;
  languages: { name: string; slug: string; count: number }[];
}) {
  const { tr } = useLang();
  return (
    <div className="chips">
      {languages.map(l => (
        <a key={l.slug} className="chip" href={`${base}/lang/${l.slug}/`}>
          <LangMark name={l.name} size={14} />
          {l.name}
          <span className="n">{l.count}</span>
        </a>
      ))}
      <a className="chip ghost-chip" href={`${base}/languages/`}>
        {tr("repos.allLanguages")}
        <ArrowRight size={13} strokeWidth={2} />
      </a>
    </div>
  );
}
