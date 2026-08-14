import type { RankedUser } from "./types.js";
import process from "node:process";
import { human, today, writeJson } from "./io.js";
import { resolveLocation } from "./location.js";
import { fetchProfiles } from "./profiles.js";
import { fetchByShards, planShards } from "./shard.js";

const FLOOR = Number(process.env.USERS_FLOOR ?? 1000);

interface SearchUser {
  login: string;
  id: number;
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.warn(`用户榜：followers >= ${FLOOR}`);

  console.warn("1/3 规划分片");
  const plan = await planShards({ resource: "users", field: "followers", floor: FLOOR });
  const truncated = plan.shards.filter(s => s.truncated);
  console.warn(`  切成 ${plan.shards.length} 片，计数请求 ${plan.countRequests} 次`);
  if (truncated.length) {
    console.warn(`  ⚠️ ${truncated.length} 片无法再切且超过 2000 条，会丢数据`);
  }

  console.warn("2/3 按分片抓取 login");
  const { items, requests } = await fetchByShards<SearchUser>(
    plan,
    item => item.login.toLowerCase(),
    (fetched, i, total) => {
      if (i % 5 === 0 || i === total) {
        console.warn(`  分片 ${i}/${total}，已收 ${fetched} 人`);
      }
    },
  );
  console.warn(`  抓到 ${items.length} 人，搜索请求 ${requests} 次`);

  console.warn("3/3 批量补全资料");
  const profiles = await fetchProfiles(
    items.map(i => i.login),
    (done, total) => {
      if (done % 800 === 0 || done === total) {
        console.warn(`  ${done}/${total}`);
      }
    },
  );

  const ranked: RankedUser[] = profiles.map((p) => {
    const region = resolveLocation(p.location);
    return {
      rank: 0,
      login: p.login,
      id: p.id,
      name: p.name,
      type: p.type,
      followers: p.followers,
      following: p.following,
      publicRepos: p.publicRepos,
      location: p.location,
      country: region?.country ?? null,
      city: region?.city ?? null,
      province: region?.province ?? null,
      provinceZh: region?.provinceZh ?? null,
      company: p.company,
      blog: p.blog,
      bio: p.bio,
      createdAt: p.createdAt,
    } satisfies RankedUser;
  });

  const users = ranked
    .filter(u => u.type === "User" && u.followers > 0)
    .sort((a, b) => b.followers - a.followers)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  const orgs = ranked
    .filter(u => u.type === "Organization")
    .sort((a, b) => b.publicRepos - a.publicRepos)
    .map((u, i) => ({ ...u, rank: i + 1 }));

  const byCountry = new Map<string, number>();
  for (const u of users) {
    if (u.country) {
      byCountry.set(u.country, (byCountry.get(u.country) ?? 0) + 1);
    }
  }
  const resolved = users.filter(u => u.country).length;
  const stated = users.filter(u => u.location).length;
  const rateOfStated = stated ? Number(((resolved / stated) * 100).toFixed(1)) : 0;
  const rateOfAll = Number(((resolved / users.length) * 100).toFixed(1));

  const size = writeJson("data/users.json", users);
  writeJson("data/orgs.json", orgs);
  writeJson("data/meta.users.json", {
    generatedAt: new Date().toISOString(),
    date: today(),
    floor: FLOOR,
    total: users.length,
    orgs: orgs.length,
    shards: plan.shards.length,
    searchRequests: requests + plan.countRequests,
    locationStated: stated,
    locationResolved: resolved,
    locationResolvedPct: rateOfStated,
    locationResolvedPctOfAll: rateOfAll,
    countries: Object.fromEntries([...byCountry.entries()].sort((a, b) => b[1] - a[1])),
  });

  const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
  console.warn(`\n完成：${users.length} 人 + ${orgs.length} 个组织，${human(size.bytes)}（gzip ${human(size.gzipped)}），耗时 ${mins} 分钟`);
  console.warn(`地区识别：填了 location 的 ${stated} 人里认出 ${resolved} 人（${rateOfStated}%）；`
    + `另有 ${users.length - stated} 人没填，占全体 ${(100 - (stated / users.length) * 100).toFixed(1)}%`);
  console.warn("前 10 国：");
  for (const [code, n] of [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.warn(`  ${code} ${n}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
