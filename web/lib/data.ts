import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "..", "data");

export interface User {
  rank: number;
  login: string;
  id: number;
  name: string | null;
  followers: number;
  publicRepos: number;
  location: string | null;
  country: string | null;
  city: string | null;
  company: string | null;
  bio: string | null;
  blog: string | null;
  following: number;
  rankDelta: number | null;
  rankDeltaMonth: number | null;
  isNew: boolean;
  createdAt: string;
}

export interface Repo {
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
  pushedAt: string;
}

export interface Meta {
  generatedAt: string;
  date: string;
  total: number;
  countries?: Record<string, number>;
  languages?: Record<string, number>;
  locationResolvedPct?: number;
}

function load<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(join(ROOT, name), "utf8")) as T;
  } catch {
    console.warn(`[ghrank] 读不到 data/${name}，先跑 pnpm build 生成数据`);
    return fallback;
  }
}

export function users(): User[] {
  return load<User[]>("users.json", []);
}

export function repos(): Repo[] {
  return load<Repo[]>("repos.json", []);
}

export function usersMeta(): Meta | null {
  return load<Meta | null>("meta.users.json", null);
}

export function reposMeta(): Meta | null {
  return load<Meta | null>("meta.repos.json", null);
}

export function locationStats(): { stated: number; resolved: number; pct: number; blank: number } {
  const all = users();
  const stated = all.filter(u => u.location).length;
  const resolved = all.filter(u => u.country).length;
  return {
    stated,
    resolved,
    pct: stated ? Math.round((resolved / stated) * 1000) / 10 : 0,
    blank: all.length - stated,
  };
}

export const MIN_COUNTRY_USERS = 20;
export const MIN_LANGUAGE_REPOS = 30;

export function countries(): { code: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const u of users()) {
    if (u.country) {
      counts.set(u.country, (counts.get(u.country) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_COUNTRY_USERS)
    .sort((a, b) => b[1] - a[1])
    .map(([code, count]) => ({ code, count }));
}

export function languages(): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of repos()) {
    if (r.language) {
      counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= MIN_LANGUAGE_REPOS)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export function languageSlug(name: string): string {
  return name.toLowerCase().replace(/\+/g, "plus").replace(/#/g, "sharp").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
