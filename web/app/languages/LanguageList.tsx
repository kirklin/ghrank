"use client";

import { useLang } from "~/components/LangProvider";
import { num } from "~/lib/i18n";

export default function LanguageList({
  base,
  languages,
}: {
  base: string;
  languages: { name: string; slug: string; count: number }[];
}) {
  const { tr } = useLang();
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th className="rank num">{tr("table.rank")}</th>
            <th>{tr("languages.language")}</th>
            <th className="num">{tr("languages.repos")}</th>
          </tr>
        </thead>
        <tbody>
          {languages.map((l, i) => (
            <tr key={l.slug}>
              <td className="rank num">{i + 1}</td>
              <td><a href={`${base}/lang/${l.slug}/`}>{l.name}</a></td>
              <td className="num">{num(l.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
