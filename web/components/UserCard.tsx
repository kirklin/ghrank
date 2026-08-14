"use client";

import type { Row } from "./UserTable";
import { Building2, Link as LinkIcon, MapPin } from "lucide-react";
import { num } from "~/lib/i18n";
import { useLang } from "./LangProvider";

export interface Anchor {
  row: Row;
  left: number;
  top: number;
  flip: boolean;
}

const WIDTH = 320;

export function cardAnchor(el: HTMLElement, row: Row): Anchor {
  const r = el.getBoundingClientRect();
  const estimated = row.bio ? 210 : 176;
  const flip = r.bottom + estimated > window.innerHeight && r.top > estimated;
  const left = Math.min(Math.max(12, r.left - 12), window.innerWidth - WIDTH - 12);
  return {
    row,
    left,
    top: flip ? r.top - 8 : r.bottom + 8,
    flip,
  };
}

export default function UserCard({
  anchor,
  countryNames,
  onEnter,
  onLeave,
}: {
  anchor: Anchor;
  countryNames: Record<string, { en: string; zh: string }>;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { tr, lang } = useLang();
  const { row } = anchor;

  const place = row.city ?? (row.country ? countryNames[row.country]?.[lang] ?? null : null);
  const site = row.blog?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      className="card"
      style={{
        left: anchor.left,
        top: anchor.top,
        width: WIDTH,
        transform: anchor.flip ? "translateY(-100%)" : undefined,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="card-head">
        <img
          src={`https://avatars.githubusercontent.com/u/${row.id}?s=96&v=4`}
          decoding="sync"
          alt=""
          width={48}
          height={48}
        />
        <div className="card-id">
          <a href={`https://github.com/${row.login}`} rel="noreferrer">{row.name ?? row.login}</a>
          <span className="card-handle">
            @
            {row.login}
          </span>
        </div>
      </div>

      {row.bio ? <p className="card-bio">{row.bio}</p> : null}

      <div className="card-stats">
        <span>
          <b>{num(row.followers)}</b>
          {" "}
          {tr("card.followers")}
        </span>
        <span>
          <b>{num(row.following)}</b>
          {" "}
          {tr("card.following")}
        </span>
        <span>
          <b>{num(row.publicRepos)}</b>
          {" "}
          {tr("card.repos")}
        </span>
      </div>

      <div className="card-meta">
        {place
          ? (
              <span>
                <MapPin size={13} strokeWidth={1.8} />
                {place}
              </span>
            )
          : null}
        {row.company
          ? (
              <span>
                <Building2 size={13} strokeWidth={1.8} />
                {row.company}
              </span>
            )
          : null}
        {site
          ? (
              <span>
                <LinkIcon size={13} strokeWidth={1.8} />
                {site}
              </span>
            )
          : null}
      </div>

      <div className="card-foot">
        {tr("card.rank", { n: num(row.rank) })}
        <span className="dot">·</span>
        {tr("card.joined", { year: row.joined })}
      </div>
    </div>
  );
}
