import { execFileSync } from "node:child_process";
import process from "node:process";

const API = "https://api.github.com";

let searchRemaining = 30;
let searchResetAt = 0;

function resolveToken(): string {
  const fromEnv = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("需要 GitHub token：设置 GITHUB_TOKEN 环境变量，或先跑 gh auth login");
  }
}

const token = resolveToken();

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSearchQuota(): Promise<void> {
  if (searchRemaining > 0) {
    return;
  }
  const waitMs = Math.max(0, searchResetAt * 1000 - Date.now()) + 1000;
  if (waitMs > 0) {
    console.warn(`  额度用尽，等 ${Math.ceil(waitMs / 1000)}s 后继续`);
    await sleep(waitMs);
  }
  searchRemaining = 30;
}

interface SearchResponse<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface SearchOptions {
  page?: number;
  perPage?: number;
  sort?: "followers" | "stars";
  order?: "asc" | "desc";
}

export async function search<T>(
  resource: "users" | "repositories",
  query: string,
  options: SearchOptions = {},
): Promise<SearchResponse<T>> {
  const { page = 1, perPage = 100, sort, order } = options;
  const url = new URL(`${API}/search/${resource}`);
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  if (sort) {
    url.searchParams.set("sort", sort);
  }
  if (order) {
    url.searchParams.set("order", order);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    await waitForSearchQuota();

    const res = await fetch(url, {
      headers: {
        "accept": "application/vnd.github+json",
        "authorization": `Bearer ${token}`,
        "user-agent": "ghrank",
        "x-github-api-version": "2022-11-28",
      },
    });

    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");
    if (remaining !== null) {
      searchRemaining = Number(remaining);
    }
    if (reset !== null) {
      searchResetAt = Number(reset);
    }

    if (res.ok) {
      return await res.json() as SearchResponse<T>;
    }

    if (res.status === 403 || res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? 0);
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 5000;
      console.warn(`  ${res.status} 限流，等 ${Math.ceil(waitMs / 1000)}s 重试`);
      await sleep(waitMs);
      continue;
    }

    if (res.status === 422) {
      throw new Error(`查询被拒绝 (422)：${query}\n${await res.text()}`);
    }

    await sleep(2 ** attempt * 1000);
  }

  throw new Error(`重试 5 次仍失败：${resource} ${query}`);
}

export async function graphql<T>(query: string): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${API}/graphql`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`,
        "content-type": "application/json",
        "user-agent": "ghrank",
      },
      body: JSON.stringify({ query }),
    });

    if (res.ok) {
      const body = await res.json() as { data?: T; errors?: { type?: string; message: string }[] };
      const fatal = body.errors?.filter(e => e.type !== "NOT_FOUND");
      if (!body.data && fatal?.length) {
        throw new Error(`GraphQL 失败：${fatal.map(e => e.message).join("; ")}`);
      }
      return body.data as T;
    }

    if (res.status === 403 || res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after") ?? 0);
      const waitMs = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 5000;
      console.warn(`  GraphQL ${res.status} 限流，等 ${Math.ceil(waitMs / 1000)}s`);
      await sleep(waitMs);
      continue;
    }

    await sleep(2 ** attempt * 1000);
  }
  throw new Error("GraphQL 重试 5 次仍失败");
}

export async function count(resource: "users" | "repositories", query: string): Promise<number> {
  const res = await search(resource, query, { page: 1, perPage: 1 });
  return res.total_count;
}
