"use client";

import type { FormEvent, PointerEvent } from "react";
import type { StarChart, StarChartMode } from "../../../src/star-chart";
import type { StarHistory } from "../../../src/stars";
import type { Key } from "~/lib/i18n";
import { KeyRound, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "~/components/LangProvider";
import { num } from "~/lib/i18n";
import { MAX_STAR_CHART_SERIES, renderStarChart } from "../../../src/star-chart";
import { fetchStarHistory, isRepoName, StarHistoryError } from "../../../src/stars";

const TOKEN_KEY = "ghrank-token";
const DAY = 86_400_000;
const COLORS = {
  text: "var(--fg)",
  muted: "var(--muted)",
  grid: "var(--chart-grid)",
  axis: "var(--chart-axis)",
  surface: "var(--bg)",
};

type Failure = "notFound" | "rateLimited" | "unauthorized" | "failed";
type Result = StarHistory | Failure;

const FAILURE_KEY: Record<Failure, Key> = {
  notFound: "stars.notFound",
  rateLimited: "stars.rateLimited",
  unauthorized: "stars.unauthorized",
  failed: "stars.failed",
};

function seriesColor(index: number): string {
  return `var(--series-${index + 1})`;
}

function failureOf(error: unknown): Failure {
  if (!(error instanceof StarHistoryError)) {
    return "failed";
  }
  if (error.rateLimited) {
    return "rateLimited";
  }
  if (error.status === 401) {
    return "unauthorized";
  }
  return error.status === 404 ? "notFound" : "failed";
}

function parseRepo(text: string): string {
  return text.trim().replace(/^https?:\/\/github\.com\//, "").split("/").slice(0, 2).join("/").replace(/\.git$/, "");
}

function unique(repos: string[]): string[] {
  const seen = new Set<string>();
  return repos.filter((repo) => {
    const key = repo.toLowerCase();
    return isRepoName(repo) && !seen.has(key) && seen.add(key);
  });
}

interface HoverRow {
  repo: string;
  color: string;
  stars: number;
  cx: number;
  cy: number;
}

function hoverRows(chart: StarChart, value: number): { label: number; x: number; rows: HoverRow[] } {
  const unit = chart.mode === "date" ? DAY : 1;
  const snapped = Math.round(value / unit) * unit;
  const rows: HoverRow[] = [];
  for (const s of chart.series) {
    const i = s.xs.length ? Math.round((snapped - s.xs[0]!) / unit) : -1;
    if (i >= 0 && i < s.xs.length) {
      rows.push({ repo: s.repo, color: s.color, stars: s.ys[i]!, cx: chart.x(s.xs[i]!), cy: chart.y(s.ys[i]!) });
    }
  }
  return { label: snapped, x: chart.x(snapped), rows: rows.sort((a, b) => b.stars - a.stars) };
}

export default function StarHistoryView() {
  const { tr } = useLang();
  const [ready, setReady] = useState(false);
  const [repos, setRepos] = useState<string[]>([]);
  const [mode, setMode] = useState<StarChartMode>("date");
  const [log, setLog] = useState(false);
  const [token, setToken] = useState("");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [draft, setDraft] = useState("");
  const [inputError, setInputError] = useState<Key | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const pendingRef = useRef(new Set<string>());
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRepos(unique((params.get("repos") ?? "").split(",")).slice(0, MAX_STAR_CHART_SERIES));
    setMode(params.get("mode") === "timeline" ? "timeline" : "date");
    setLog(params.get("log") === "1");
    setToken(window.localStorage.getItem(TOKEN_KEY) ?? "");
    setReady(true);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry!.contentRect.width)));
    observer.observe(frameRef.current!);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const query = [
      repos.length ? `repos=${repos.join(",")}` : "",
      mode === "timeline" ? "mode=timeline" : "",
      log ? "log=1" : "",
    ].filter(Boolean).join("&");
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [ready, repos, mode, log]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    for (const repo of repos) {
      const key = repo.toLowerCase();
      if (results[key] || pendingRef.current.has(key)) {
        continue;
      }
      pendingRef.current.add(key);
      fetchStarHistory(repo, token ? { token } : {})
        .then((history): Result => history, failureOf)
        .then((result) => {
          pendingRef.current.delete(key);
          setResults(prev => ({ ...prev, [key]: result }));
        });
    }
  }, [ready, repos, results, token]);

  const chart = useMemo(() => {
    const histories: StarHistory[] = [];
    const palette: string[] = [];
    for (const [i, repo] of repos.entries()) {
      const result = results[repo.toLowerCase()];
      if (typeof result === "object") {
        histories.push(result);
        palette.push(seriesColor(i));
      }
    }
    if (!histories.length || !width) {
      return null;
    }
    return renderStarChart(histories, {
      mode,
      log,
      colors: COLORS,
      palette,
      width,
      plotHeight: Math.round(Math.min(Math.max(width * 0.4, 240), 440)),
      legend: false,
    });
  }, [repos, results, mode, log, width]);

  const failures = repos.flatMap((repo) => {
    const result = results[repo.toLowerCase()];
    return typeof result === "string" ? [{ repo, kind: result }] : [];
  });
  const tokenFailure = failures.find(f => f.kind === "rateLimited" || f.kind === "unauthorized")?.kind;
  const repoFailures = failures.filter(f => f.kind === "notFound" || f.kind === "failed");

  const addRepo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const repo = parseRepo(draft);
    if (!isRepoName(repo)) {
      setInputError("stars.invalid");
      return;
    }
    if (repos.length >= MAX_STAR_CHART_SERIES) {
      setInputError("stars.limit");
      return;
    }
    setRepos(unique([...repos, repo]));
    setDraft("");
    setInputError(null);
  };

  const removeRepo = (repo: string) => {
    setRepos(repos.filter(r => r !== repo));
    setInputError(null);
    setResults((prev) => {
      const key = repo.toLowerCase();
      return typeof prev[key] === "string"
        ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
        : prev;
    });
  };

  const saveToken = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("token") ?? "").trim();
    if (value) {
      window.localStorage.setItem(TOKEN_KEY, value);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    setToken(value);
    setTokenOpen(false);
    setResults(prev => Object.fromEntries(
      Object.entries(prev).filter(([, result]) => result !== "rateLimited" && result !== "unauthorized"),
    ));
  };

  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!chart) {
      return;
    }
    const px = event.clientX - event.currentTarget.getBoundingClientRect().left;
    setHover(px >= chart.plot.left && px <= chart.plot.right ? chart.invertX(px) : null);
  };

  const point = chart && hover !== null ? hoverRows(chart, hover) : null;

  return (
    <>
      <form className="field" onSubmit={addRepo}>
        <Plus size={16} strokeWidth={2} />
        <input
          className="search"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={tr("stars.add")}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInputError(null);
          }}
        />
        <button type="submit" className="field-btn">{tr("action.add")}</button>
      </form>

      {inputError ? <p className="notice">{tr(inputError, { n: MAX_STAR_CHART_SERIES })}</p> : null}
      {ready && !repos.length ? <p className="notice">{tr("stars.empty")}</p> : null}

      {repos.length
        ? (
            <div className="star-bar">
              <div className="star-legend">
                {repos.map((repo, i) => {
                  const result = results[repo.toLowerCase()];
                  const loaded = typeof result === "object";
                  return (
                    <span key={repo} className={`star-key${loaded ? "" : " idle"}`}>
                      <span className="star-swatch" style={{ background: loaded ? seriesColor(i) : "var(--faint)" }} />
                      <a href={`https://github.com/${repo}`} rel="noreferrer">{repo}</a>
                      {loaded ? <span className="n">{num(result.stars)}</span> : null}
                      {result ? null : <span className="n">{tr("stars.loading")}</span>}
                      <button type="button" className="chip-x" onClick={() => removeRepo(repo)} aria-label={tr("action.remove")} title={tr("action.remove")}>
                        <X size={13} strokeWidth={2} />
                      </button>
                    </span>
                  );
                })}
              </div>

              <div className="star-options">
                <div className="segment">
                  <button type="button" className={mode === "date" ? "on" : ""} onClick={() => setMode("date")}>
                    {tr("stars.modeDate")}
                  </button>
                  <button type="button" className={mode === "timeline" ? "on" : ""} onClick={() => setMode("timeline")}>
                    {tr("stars.modeTimeline")}
                  </button>
                </div>
                <div className="segment">
                  <button type="button" className={log ? "" : "on"} onClick={() => setLog(false)}>
                    {tr("stars.linear")}
                  </button>
                  <button type="button" className={log ? "on" : ""} onClick={() => setLog(true)}>
                    {tr("stars.log")}
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setTokenOpen(!tokenOpen)}
                  title={tr("stars.token")}
                  aria-label={tr("stars.token")}
                >
                  <KeyRound size={15} strokeWidth={1.9} />
                </button>
              </div>
            </div>
          )
        : null}

      {repoFailures.map(f => (
        <p key={f.repo} className="notice">{tr(FAILURE_KEY[f.kind], { repo: f.repo })}</p>
      ))}
      {tokenFailure ? <p className="notice">{tr(FAILURE_KEY[tokenFailure])}</p> : null}

      {tokenOpen || tokenFailure
        ? (
            <>
              <form className="field star-token" onSubmit={saveToken}>
                <KeyRound size={16} strokeWidth={2} />
                <input
                  key={token}
                  className="search"
                  type="password"
                  name="token"
                  autoComplete="off"
                  placeholder={tr("stars.tokenPlaceholder")}
                  defaultValue={token}
                />
                <button type="submit" className="field-btn">{tr("action.save")}</button>
              </form>
              <p className="notice">{tr("stars.tokenHint")}</p>
            </>
          )
        : null}

      <div ref={frameRef} className="star-frame">
        {chart
          ? (
              <div className="star-chart" onPointerMove={trackPointer} onPointerLeave={() => setHover(null)}>
                {/* eslint-disable-next-line react/dom-no-dangerously-set-innerhtml */}
                <div dangerouslySetInnerHTML={{ __html: chart.svg }} />
                {point?.rows.length
                  ? (
                      <>
                        <svg className="star-hover" width={chart.width} height={chart.height} aria-hidden="true">
                          <line x1={point.x} x2={point.x} y1={chart.plot.top} y2={chart.plot.bottom} stroke="var(--chart-axis)" strokeWidth={1} />
                          {point.rows.map(row => (
                            <circle key={row.repo} cx={row.cx} cy={row.cy} r={4.5} fill={row.color} stroke="var(--bg)" strokeWidth={2} />
                          ))}
                        </svg>
                        <div
                          className="star-tip"
                          style={{
                            left: point.x,
                            top: chart.plot.top + 6,
                            transform: point.x > chart.width / 2 ? "translateX(calc(-100% - 14px))" : "translateX(14px)",
                          }}
                        >
                          <div className="star-tip-head">
                            {chart.mode === "date"
                              ? new Date(point.label).toISOString().slice(0, 10)
                              : tr("stars.day", { n: point.label + 1 })}
                          </div>
                          {point.rows.map(row => (
                            <div key={row.repo} className="star-tip-row">
                              <span className="star-swatch" style={{ background: row.color }} />
                              <b>{num(row.stars)}</b>
                              <span>{row.repo}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  : null}
              </div>
            )
          : null}
      </div>
    </>
  );
}
