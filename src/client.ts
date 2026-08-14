import type { RankedRepo, RankedUser } from "./types.js";

export const DEFAULT_ENDPOINT = "https://ghrank.com/data";

export interface ClientOptions {
  endpoint?: string;
  fetch?: typeof globalThis.fetch;
}

export interface RankedUserLite {
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
  avatar: string;
}

export interface RankedRepoLite {
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

interface Payload {
  columns: readonly string[];
  rows: unknown[][];
}

async function load(name: string, options: ClientOptions): Promise<Payload> {
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;
  const request = options.fetch ?? globalThis.fetch;
  const res = await request(`${endpoint}/${name}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load ${name}.json: HTTP ${res.status}`);
  }
  return await res.json() as Payload;
}

export function avatarUrl(id: number, size = 96): string {
  return `https://avatars.githubusercontent.com/u/${id}?s=${size}&v=4`;
}

export async function getUsers(options: ClientOptions = {}): Promise<RankedUserLite[]> {
  const payload = await load("users", options);
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
    avatar: avatarUrl(r[2] as number),
  }));
}

export async function getRepos(options: ClientOptions = {}): Promise<RankedRepoLite[]> {
  const payload = await load("repos", options);
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

export async function getUsersByCountry(code: string, options: ClientOptions = {}): Promise<RankedUserLite[]> {
  const upper = code.toUpperCase();
  const all = await getUsers(options);
  return all.filter(u => u.country === upper).map((u, i) => ({ ...u, rank: i + 1 }));
}

export async function getReposByLanguage(language: string, options: ClientOptions = {}): Promise<RankedRepoLite[]> {
  const all = await getRepos(options);
  const target = language.toLowerCase();
  return all.filter(r => r.language?.toLowerCase() === target).map((r, i) => ({ ...r, rank: i + 1 }));
}

export type { RankedRepo, RankedUser };
