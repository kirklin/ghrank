"use client";

import { ArrowRight } from "lucide-react";
import { useLang } from "~/components/LangProvider";

export default function RegionChips({
  base,
  regions,
}: {
  base: string;
  regions: { code: string; count: number; flag: string; name: { en: string; zh: string } }[];
}) {
  const { tr, lang } = useLang();
  return (
    <div className="chips">
      {regions.map(r => (
        <a key={r.code} className="chip" href={`${base}/c/${r.code.toLowerCase()}/`}>
          <span className="flag">{r.flag}</span>
          {r.name[lang]}
          <span className="n">{r.count}</span>
        </a>
      ))}
      <a className="chip ghost-chip" href={`${base}/countries/`}>
        {tr("home.allRegions")}
        <ArrowRight size={13} strokeWidth={2} />
      </a>
    </div>
  );
}
