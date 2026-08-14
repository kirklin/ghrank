import type { RankedRepo, RankedUser } from "./types.js";
import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { human, today, writeJson } from "./io.js";

type Snapshot = Record<string, [rank: number, value: number]>;

interface Delta {
  rankDelta: number | null;
  valueDelta: number | null;
  isNew: boolean;
}

function read<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    console.warn(`  ${path} 读不动，当作没有`);
    return null;
  }
}

function diff(prev: Snapshot | null, login: string, rank: number, value: number): Delta {
  const before = prev?.[login];
  if (!before) {
    return { rankDelta: null, valueDelta: null, isNew: prev !== null };
  }
  return {
    rankDelta: before[0] - rank,
    valueDelta: value - before[1],
    isNew: false,
  };
}

function snapshotOf<T>(rows: T[], key: (row: T) => string, rank: (row: T) => number, value: (row: T) => number): Snapshot {
  const snap: Snapshot = {};
  for (const row of rows) {
    snap[key(row)] = [rank(row), value(row)];
  }
  return snap;
}

function apply<T extends { rank: number }>(
  rows: T[],
  key: (row: T) => string,
  value: (row: T) => number,
  previous: Snapshot | null,
  monthly: Snapshot | null,
): (T & { rankDelta: number | null; valueDelta: number | null; isNew: boolean; rankDeltaMonth: number | null })[] {
  return rows.map((row) => {
    const d = diff(previous, key(row), row.rank, value(row));
    const m = diff(monthly, key(row), row.rank, value(row));
    return { ...row, ...d, rankDeltaMonth: m.rankDelta };
  });
}

function main(): void {
  const date = today();
  const isFirstOfMonth = new Date().getUTCDate() === 1;
  const month = date.slice(0, 7);

  const users = read<RankedUser[]>("data/users.json");
  const repos = read<RankedRepo[]>("data/repos.json");
  if (!users || !repos) {
    console.error("先跑 pnpm fetch 生成 data/users.json 和 data/repos.json");
    process.exit(1);
  }

  const prevUsers = read<Snapshot>("data/history/prev-users.json");
  const prevRepos = read<Snapshot>("data/history/prev-repos.json");
  const monthUsers = read<Snapshot>("data/history/month-users.json");
  const monthRepos = read<Snapshot>("data/history/month-repos.json");

  if (!prevUsers) {
    console.warn("没有上一份快照，本次只存档，涨跌留空");
  }

  const usersWithDelta = apply(users, u => u.login, u => u.followers, prevUsers, monthUsers);
  const reposWithDelta = apply(repos, r => r.fullName, r => r.stars, prevRepos, monthRepos);

  const uSize = writeJson("data/users.json", usersWithDelta);
  const rSize = writeJson("data/repos.json", reposWithDelta);

  const userSnap = snapshotOf(users, u => u.login, u => u.rank, u => u.followers);
  const repoSnap = snapshotOf(repos, r => r.fullName, r => r.rank, r => r.stars);
  writeJson("data/history/prev-users.json", userSnap);
  writeJson("data/history/prev-repos.json", repoSnap);

  if (isFirstOfMonth || !monthUsers) {
    writeJson("data/history/month-users.json", userSnap);
    writeJson("data/history/month-repos.json", repoSnap);
    writeJson(`data/history/${month}-users.json`, userSnap);
    console.warn(`存下 ${month} 月度存档`);
  }

  const climbed = usersWithDelta.filter(u => (u.rankDelta ?? 0) > 0).length;
  const fell = usersWithDelta.filter(u => (u.rankDelta ?? 0) < 0).length;
  const fresh = usersWithDelta.filter(u => u.isNew).length;

  console.warn(`\n用户榜 ${users.length} 条：上升 ${climbed}，下降 ${fell}，新进 ${fresh}`);
  console.warn(`产物 users.json ${human(uSize.bytes)}（gzip ${human(uSize.gzipped)}），repos.json ${human(rSize.bytes)}（gzip ${human(rSize.gzipped)}）`);

  const movers = usersWithDelta
    .filter(u => u.rankDelta !== null)
    .sort((a, b) => (b.rankDelta ?? 0) - (a.rankDelta ?? 0))
    .slice(0, 5);
  if (movers.length) {
    console.warn("涨得最多的 5 个：");
    for (const u of movers) {
      console.warn(`  ${u.login.padEnd(20)} 第 ${u.rank} 名，上升 ${u.rankDelta}，followers ${u.valueDelta && u.valueDelta > 0 ? "+" : ""}${u.valueDelta}`);
    }
  }
}

main();
