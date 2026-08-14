"use client";

import { Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { num } from "~/lib/i18n";
import { Delta } from "./Delta";
import { LangLabel } from "./Lang";
import { useLang } from "./LangProvider";

export interface RepoRow {
  rank: number;
  fullName: string;
  id: number;
  owner: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  rankDelta: number | null;
  isNew: boolean;
  pushed: string;
}

type SortKey = "rank" | "stars" | "forks" | "pushed";

const PAGE = 100;

function decode(payload: { rows: unknown[][] }): RepoRow[] {
  return payload.rows.map(r => ({
    rank: r[0] as number,
    fullName: r[1] as string,
    id: r[2] as number,
    owner: (r[1] as string).split("/")[0] ?? "",
    description: r[3] as string | null,
    language: r[4] as string | null,
    stars: r[5] as number,
    forks: r[6] as number,
    rankDelta: r[7] as number | null,
    isNew: r[8] === 1,
    pushed: r[9] as string,
  }));
}

export default function RepoTable({
  rows: seed,
  showLanguage = true,
  fullUrl,
  total,
}: {
  rows: RepoRow[];
  showLanguage?: boolean;
  fullUrl?: string;
  total?: number;
}) {
  const { tr } = useLang();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");
  const [limit, setLimit] = useState(PAGE);
  const [full, setFull] = useState<RepoRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);

  const ensureFull = useCallback(() => {
    if (!fullUrl || startedRef.current) {
      return;
    }
    startedRef.current = true;
    setLoading(true);
    fetch(fullUrl)
      .then(res => res.json())
      .then((payload) => {
        setFull(decode(payload));
        setLoading(false);
      })
      .catch(() => {
        startedRef.current = false;
        setLoading(false);
      });
  }, [fullUrl]);

  const rows = full ?? seed;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? rows.filter(r =>
          r.fullName.toLowerCase().includes(q)
          || r.description?.toLowerCase().includes(q)
          || r.language?.toLowerCase().includes(q),
        )
      : rows;

    if (sort === "rank") {
      return matched;
    }
    return [...matched].sort((a, b) => {
      if (sort === "pushed") {
        return (b.pushed ?? "").localeCompare(a.pushed ?? "");
      }
      return b[sort] - a[sort];
    });
  }, [rows, query, sort]);

  const header = (key: SortKey, labelKey: Parameters<typeof tr>[0], className = "num") => (
    <th
      className={`${className} sortable`}
      onClick={() => {
        ensureFull();
        setSort(key);
        setLimit(PAGE);
      }}
      title={tr("table.sortHint")}
    >
      {tr(labelKey)}
      {sort === key ? " ↓" : ""}
    </th>
  );

  return (
    <>
      <label className="field">
        <Search size={16} strokeWidth={2} />
        <input
          className="search"
          type="search"
          placeholder={tr("search.repos")}
          value={query}
          onChange={(e) => {
            ensureFull();
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
        />
      </label>
      <p className="count">
        {loading
          ? tr("count.loading")
          : query
            ? tr("count.matchedRepos", { n: num(filtered.length) })
            : tr("count.totalRepos", { n: num(total ?? rows.length) })}
      </p>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              {header("rank", "table.rank", "rank col-rank")}
              <th className="col-main">{tr("table.repository")}</th>
              {header("stars", "table.stars", "num col-num")}
              {header("forks", "table.forks", "num col-num")}
              {showLanguage ? <th className="col-lang c-lang">{tr("table.language")}</th> : null}
              <th className="c-desc">{tr("table.description")}</th>
              {header("pushed", "table.pushed", "num col-date c-date")}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map(r => (
              <tr key={r.fullName}>
                <td className="rank num">
                  {r.rank}
                  <Delta value={r.rankDelta} isNew={r.isNew} />
                </td>
                <td className="repo">
                  <a href={`https://github.com/${r.fullName}`} rel="noreferrer">
                    <span className="owner">
                      {r.fullName.split("/")[0]}
                      /
                    </span>
                    <span className="repo-name">{r.fullName.split("/")[1]}</span>
                  </a>
                </td>
                <td className="num">{num(r.stars)}</td>
                <td className="num">{num(r.forks)}</td>
                {showLanguage ? <td className="c-lang"><LangLabel name={r.language} /></td> : null}
                <td className="desc c-desc" title={r.description ?? ""}>{r.description ?? "—"}</td>
                <td className="num dim c-date">{r.pushed ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > limit
        ? (
            <div className="more">
              <button type="button" onClick={() => setLimit(l => l + PAGE * 4)}>
                {tr("action.more", { n: num(Math.min(PAGE * 4, filtered.length - limit)) })}
              </button>
            </div>
          )
        : null}
    </>
  );
}
