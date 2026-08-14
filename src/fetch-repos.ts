import type { RankedRepo } from "./types.js";
import process from "node:process";
import { human, today, writeJson } from "./io.js";
import { fetchByShards, planShards } from "./shard.js";

const FLOOR = Number(process.env.REPOS_FLOOR ?? 2000);

interface SearchRepo {
  id: number;
  full_name: string;
  owner: { login: string; type: "User" | "Organization" } | null;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics?: string[];
  license: { spdx_id: string } | null;
  archived: boolean;
  created_at: string;
  pushed_at: string;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.warn(`仓库榜：stars >= ${FLOOR}`);

  console.warn("1/2 规划分片");
  const plan = await planShards({ resource: "repositories", field: "stars", floor: FLOOR });
  const truncated = plan.shards.filter(s => s.truncated);
  console.warn(`  切成 ${plan.shards.length} 片，计数请求 ${plan.countRequests} 次`);
  if (truncated.length) {
    console.warn(`  ⚠️ ${truncated.length} 片无法再切且超过 2000 条，会丢数据`);
  }

  console.warn("2/2 按分片抓取");
  const { items, requests } = await fetchByShards<SearchRepo>(
    plan,
    item => item.id,
    (fetched, i, total) => {
      if (i % 10 === 0 || i === total) {
        console.warn(`  分片 ${i}/${total}，已收 ${fetched} 个`);
      }
    },
  );

  const repos: RankedRepo[] = items
    .map(r => ({
      rank: 0,
      fullName: r.full_name,
      id: r.id,
      owner: r.owner?.login ?? r.full_name.split("/")[0]!,
      ownerType: r.owner?.type ?? "User",
      description: r.description ? r.description.slice(0, 160) : null,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      topics: (r.topics ?? []).slice(0, 8),
      license: r.license?.spdx_id ?? null,
      archived: r.archived,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
    } satisfies RankedRepo))
    .sort((a, b) => b.stars - a.stars)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const byLanguage = new Map<string, number>();
  for (const r of repos) {
    const key = r.language ?? "(未标注)";
    byLanguage.set(key, (byLanguage.get(key) ?? 0) + 1);
  }

  const size = writeJson("data/repos.json", repos);
  writeJson("data/meta.repos.json", {
    generatedAt: new Date().toISOString(),
    date: today(),
    floor: FLOOR,
    total: repos.length,
    shards: plan.shards.length,
    searchRequests: requests + plan.countRequests,
    languages: Object.fromEntries([...byLanguage.entries()].sort((a, b) => b[1] - a[1])),
  });

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.warn(`\n完成：${repos.length} 个仓库，${human(size.bytes)}（gzip ${human(size.gzipped)}），耗时 ${mins} 分钟`);
  console.warn("前 10 语言：");
  for (const [lang, n] of [...byLanguage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.warn(`  ${lang.padEnd(14)} ${n}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
