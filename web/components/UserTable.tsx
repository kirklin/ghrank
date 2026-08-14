"use client";

import type { Anchor } from "./UserCard";
import { Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { num } from "~/lib/i18n";
import { Delta } from "./Delta";
import { useLang } from "./LangProvider";
import UserCard, { cardAnchor } from "./UserCard";

export interface Row {
  rank: number;
  login: string;
  id: number;
  name: string | null;
  followers: number;
  publicRepos: number;
  country: string | null;
  city: string | null;
  company: string | null;
  rankDelta: number | null;
  isNew: boolean;
  joined: number;
  bio: string | null;
  blog: string | null;
  following: number;
}

export interface Facet {
  label: string;
  count: number;
}

type SortKey = "rank" | "followers" | "publicRepos" | "joined";

const PAGE = 100;

function decode(payload: { rows: unknown[][] }): Row[] {
  return payload.rows.map(r => ({
    rank: r[0] as number,
    login: r[1] as string,
    id: r[2] as number,
    name: r[3] as string | null,
    followers: r[4] as number,
    publicRepos: r[5] as number,
    country: r[6] as string | null,
    city: r[7] as string | null,
    company: r[8] as string | null,
    rankDelta: r[9] as number | null,
    isNew: r[10] === 1,
    joined: r[11] as number,
    bio: r[12] as string | null,
    blog: r[13] as string | null,
    following: r[14] as number,
  }));
}

export default function UserTable({
  rows: seed,
  showLocation = true,
  fullUrl,
  total,
  countryNames = {},
  facets,
}: {
  rows: Row[];
  showLocation?: boolean;
  fullUrl?: string;
  total?: number;
  countryNames?: Record<string, { en: string; zh: string }>;
  facets?: Facet[];
}) {
  const { tr, lang } = useLang();
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("rank");
  const [limit, setLimit] = useState(PAGE);
  const [full, setFull] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const shownRef = useRef(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  }, []);

  const show = useCallback((next: Anchor | null) => {
    shownRef.current = next !== null;
    setAnchor(next);
  }, []);

  const openCard = useCallback((el: HTMLElement, row: Row) => {
    if (!window.matchMedia("(hover: hover)").matches) {
      return;
    }
    clearTimers();
    if (shownRef.current) {
      show(cardAnchor(el, row));
      return;
    }
    openTimerRef.current = setTimeout(() => show(cardAnchor(el, row)), 220);
  }, [clearTimers, show]);

  const closeCard = useCallback(() => {
    clearTimers();
    closeTimerRef.current = setTimeout(show, 140, null);
  }, [clearTimers, show]);

  const holdCard = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

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
    let matched = city ? rows.filter(r => r.city === city) : rows;
    if (q) {
      matched = matched.filter(r =>
        r.login.toLowerCase().includes(q)
        || r.name?.toLowerCase().includes(q)
        || r.company?.toLowerCase().includes(q)
        || r.city?.toLowerCase().includes(q),
      );
    }

    if (sort === "rank") {
      return matched;
    }
    return [...matched].sort((a, b) => {
      if (sort === "joined") {
        return a.joined - b.joined;
      }
      return b[sort] - a[sort];
    });
  }, [rows, query, city, sort]);

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

  const active = query.trim() !== "" || city !== null;

  return (
    <>
      {facets?.length
        ? (
            <div className="chips">
              <button
                type="button"
                className={city === null ? "chip on" : "chip"}
                onClick={() => {
                  setCity(null);
                  setLimit(PAGE);
                }}
              >
                {tr("filter.clear")}
              </button>
              {facets.map(f => (
                <button
                  key={f.label}
                  type="button"
                  className={city === f.label ? "chip on" : "chip"}
                  onClick={() => {
                    setCity(city === f.label ? null : f.label);
                    setLimit(PAGE);
                  }}
                >
                  {f.label}
                  <span className="n">{f.count}</span>
                </button>
              ))}
            </div>
          )
        : null}

      <label className="field">
        <Search size={16} strokeWidth={2} />
        <input
          className="search"
          type="search"
          placeholder={tr("search.users")}
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
          : active
            ? tr("count.matchedUsers", { n: num(filtered.length) })
            : tr("count.totalUsers", { n: num(total ?? rows.length) })}
      </p>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              {header("rank", "table.rank", "rank col-rank")}
              <th className="col-main">{tr("table.user")}</th>
              {header("followers", "table.followers", "num col-num")}
              {header("publicRepos", "table.repos", "num col-num")}
              {showLocation ? <th className="col-place c-place">{tr("table.location")}</th> : null}
              <th className="c-company">{tr("table.company")}</th>
              {header("joined", "table.joined", "num col-date c-date")}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map(r => (
              <tr key={r.login}>
                <td className="rank num">
                  {r.rank}
                  <Delta value={r.rankDelta} isNew={r.isNew} />
                </td>
                <td>
                  <a
                    className="who"
                    href={`https://github.com/${r.login}`}
                    rel="noreferrer"
                    onMouseEnter={e => openCard(e.currentTarget, r)}
                    onMouseLeave={closeCard}
                    onFocus={e => show(cardAnchor(e.currentTarget, r))}
                    onBlur={closeCard}
                  >
                    <img src={`https://avatars.githubusercontent.com/u/${r.id}?s=96&v=4`} alt="" loading="lazy" width={28} height={28} />
                    <span className="who-text">
                      <span className="who-name">{r.name ?? r.login}</span>
                      <span className="who-handle">
                        @
                        {r.login}
                      </span>
                    </span>
                  </a>
                </td>
                <td className="num">{num(r.followers)}</td>
                <td className="num">{num(r.publicRepos)}</td>
                {showLocation ? <td className="dim c-place">{r.city ?? (r.country ? countryNames[r.country]?.[lang] ?? "—" : "—")}</td> : null}
                <td className="desc c-company">{r.company ?? "—"}</td>
                <td className="num dim c-date">{r.joined || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {anchor
        ? <UserCard anchor={anchor} countryNames={countryNames} onEnter={holdCard} onLeave={closeCard} />
        : null}

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
