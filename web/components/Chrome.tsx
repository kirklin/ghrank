"use client";

import type { Key } from "~/lib/i18n";
import { LangSwitch, useLang } from "./LangProvider";
import ThemeSwitch from "./ThemeSwitch";

export function Header({ base, date }: { base: string; date: string | null }) {
  const { tr } = useLang();
  return (
    <header>
      <div className="bar">
        <a className="brand" href={`${base}/`}>ghrank</a>
        <nav>
          <a href={`${base}/`}>{tr("nav.users")}</a>
          <a href={`${base}/repos/`}>{tr("nav.repos")}</a>
          <a href={`${base}/countries/`}>{tr("nav.regions")}</a>
          <a href={`${base}/languages/`}>{tr("nav.languages")}</a>
        </nav>
        <span className="controls">
          {date ? <span className="stamp">{date}</span> : null}
          <ThemeSwitch />
          <LangSwitch />
        </span>
      </div>
    </header>
  );
}

export function Footer() {
  const { tr } = useLang();
  return (
    <footer>
      <a href="https://github.com/kirklin" rel="noreferrer">Kirk Lin</a>
      <span className="dot">·</span>
      <a href="https://github.com/kirklin/ghrank" rel="noreferrer">{tr("footer.source")}</a>
    </footer>
  );
}

export type Value = string | number | { en: string; zh: string };

export function Title({
  titleKey,
  values,
  prefix,
}: {
  titleKey: Key;
  values?: Record<string, Value>;
  prefix?: string;
}) {
  const { tr, lang } = useLang();

  const resolved: Record<string, string | number> = {};
  for (const [name, value] of Object.entries(values ?? {})) {
    resolved[name] = typeof value === "object" ? value[lang] : value;
  }

  return (
    <h1>
      {prefix ? `${prefix} ` : ""}
      {tr(titleKey, resolved)}
    </h1>
  );
}
