import type { Shard } from "./types.js";
import { count, search } from "./github.js";

const SEARCH_RESULT_CAP = 1000;
const PER_PAGE = 100;

export type RankField = "followers" | "stars";
export type Resource = "users" | "repositories";

export interface ShardPlan {
  field: RankField;
  resource: Resource;
  floor: number;
  extraQuery: string;
  total: number;
  shards: Shard[];
  countRequests: number;
}

function rangeQuery(field: string, lo: number, hi: number | null, extra: string): string {
  let range: string;
  if (hi === null) {
    range = `${field}:>=${lo}`;
  } else if (lo === hi) {
    range = `${field}:${lo}`;
  } else {
    range = `${field}:${lo}..${hi}`;
  }
  return extra ? `${range} ${extra}` : range;
}

async function probeCeiling(
  resource: Resource,
  field: RankField,
  floor: number,
  extra: string,
): Promise<{ ceiling: number; requests: number }> {
  let requests = 0;
  let ceiling = Math.max(floor * 2, floor + 1000);
  for (let i = 0; i < 24; i++) {
    const above = await count(resource, rangeQuery(field, ceiling + 1, null, extra));
    requests++;
    if (above === 0) {
      return { ceiling, requests };
    }
    ceiling *= 2;
  }
  return { ceiling, requests };
}

export async function planShards(opts: {
  resource: Resource;
  field: RankField;
  floor: number;
  extraQuery?: string;
  cap?: number;
}): Promise<ShardPlan> {
  const { resource, field, floor } = opts;
  const extra = opts.extraQuery ?? "";
  const cap = opts.cap ?? SEARCH_RESULT_CAP;

  let countRequests = 0;
  const shards: Shard[] = [];

  const probe = await probeCeiling(resource, field, floor, extra);
  countRequests += probe.requests;

  const total = await count(resource, rangeQuery(field, floor, probe.ceiling, extra));
  countRequests++;
  console.warn(`  ${field}>=${floor} 共 ${total} 条，上界探到 ${probe.ceiling}`);

  async function bisect(lo: number, hi: number, known: number): Promise<void> {
    if (known === 0) {
      return;
    }

    if (known <= cap) {
      shards.push({ lo, hi, count: known, truncated: false });
      return;
    }

    if (lo >= hi) {
      shards.push({ lo, hi, count: known, truncated: known > cap * 2 });
      return;
    }

    const mid = Math.floor((lo + hi) / 2);
    const left = await count(resource, rangeQuery(field, lo, mid, extra));
    countRequests++;

    let right = known - left;
    if (right > cap * 0.9 && right <= cap * 1.1) {
      right = await count(resource, rangeQuery(field, mid + 1, hi, extra));
      countRequests++;
    }

    await bisect(lo, mid, left);
    await bisect(mid + 1, hi, right);
  }

  await bisect(floor, probe.ceiling, total);
  shards.sort((a, b) => b.lo - a.lo);

  return { field, resource, floor, extraQuery: extra, total, shards, countRequests };
}

export interface FetchResult<T> {
  items: T[];
  requests: number;
}

export async function fetchByShards<T>(
  plan: ShardPlan,
  identify: (item: T) => string | number,
  onProgress?: (fetched: number, shardIndex: number, shardCount: number) => void,
): Promise<FetchResult<T>> {
  const seen = new Set<string | number>();
  const items: T[] = [];
  let requests = 0;

  for (const [index, shard] of plan.shards.entries()) {
    const orders: ("desc" | "asc")[] = shard.count > SEARCH_RESULT_CAP ? ["desc", "asc"] : ["desc"];
    const q = rangeQuery(plan.field, shard.lo, shard.hi, plan.extraQuery);

    for (const order of orders) {
      const reachable = Math.min(shard.count, SEARCH_RESULT_CAP);
      const pages = Math.ceil(reachable / PER_PAGE);
      for (let page = 1; page <= pages; page++) {
        const res = await search<T>(plan.resource, q, {
          page,
          perPage: PER_PAGE,
          sort: plan.field,
          order,
        });
        requests++;
        for (const item of res.items) {
          const key = identify(item);
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);
          items.push(item);
        }
        if (res.items.length < PER_PAGE) {
          break;
        }
      }
    }

    onProgress?.(items.length, index + 1, plan.shards.length);
  }

  return { items, requests };
}
