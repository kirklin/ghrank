import type { RankedRepo, RankedUser } from "./types.js";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { human, writeJson } from "./io.js";

export const USER_COLUMNS = [
  "rank",
  "login",
  "id",
  "name",
  "followers",
  "publicRepos",
  "country",
  "city",
  "company",
  "rankDelta",
  "isNew",
  "joined",
  "bio",
  "blog",
  "following",
] as const;

export const REPO_COLUMNS = [
  "rank",
  "fullName",
  "id",
  "description",
  "language",
  "stars",
  "forks",
  "rankDelta",
  "isNew",
  "pushed",
] as const;

type WithDelta<T> = T & { rankDelta: number | null; isNew: boolean };

function read<T>(path: string): T | null {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) as T : null;
}

function main(): void {
  const users = read<WithDelta<RankedUser>[]>("data/users.json");
  const repos = read<WithDelta<RankedRepo>[]>("data/repos.json");
  if (!users || !repos) {
    console.error("先跑 pnpm fetch 生成榜单数据");
    process.exit(1);
  }

  const userRows = users.map(u => [
    u.rank,
    u.login,
    u.id,
    u.name,
    u.followers,
    u.publicRepos,
    u.country,
    u.city,
    u.company,
    u.rankDelta,
    u.isNew ? 1 : 0,
    Number(u.createdAt.slice(0, 4)),
    u.bio ? u.bio.slice(0, 100) : null,
    u.blog,
    u.following,
  ]);

  const repoRows = repos.map(r => [
    r.rank,
    r.fullName,
    r.id,
    r.description ? r.description.slice(0, 90) : null,
    r.language,
    r.stars,
    r.forks,
    r.rankDelta,
    r.isNew ? 1 : 0,
    r.pushedAt.slice(0, 10),
  ]);

  const u = writeJson("web/public/data/users.json", { columns: USER_COLUMNS, rows: userRows });
  const r = writeJson("web/public/data/repos.json", { columns: REPO_COLUMNS, rows: repoRows });

  const before = readFileSync("data/users.json").length;
  console.warn(`用户榜 ${users.length} 条：${human(before)} 压到 ${human(u.bytes)}（gzip ${human(u.gzipped)}）`);
  console.warn(`仓库榜 ${repos.length} 条：${human(r.bytes)}（gzip ${human(r.gzipped)}）`);
}

main();
