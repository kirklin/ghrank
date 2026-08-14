"use client";

import { useLang } from "~/components/LangProvider";
import { num } from "~/lib/i18n";

export default function RegionList({
  base,
  regions,
}: {
  base: string;
  regions: { code: string; count: number; flag: string; name: { en: string; zh: string } }[];
}) {
  const { tr, lang } = useLang();
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th className="rank num">{tr("table.rank")}</th>
            <th>{tr("countries.region")}</th>
            <th className="num">{tr("countries.people")}</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((r, i) => (
            <tr key={r.code}>
              <td className="rank num">{i + 1}</td>
              <td>
                <a href={`${base}/c/${r.code.toLowerCase()}/`}>
                  {r.flag}
                  {" "}
                  {r.name[lang]}
                </a>
              </td>
              <td className="num">{num(r.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
