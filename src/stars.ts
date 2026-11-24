const API = "https://api.github.com";
const API_VERSION = "2026-03-10";
const PER_PAGE = 30;
const DAY_SECONDS = 86_400;
const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;
const LAST_PAGE_PATTERN = /[?&]page=(\d+)>; rel="last"/;

export interface StarPoint {
  date: string;
  stars: number;
}

export interface StarHistory {
  repo: string;
  stars: number;
  points: StarPoint[];
}

export interface StarHistoryOptions {
  token?: string;
  fetch?: typeof globalThis.fetch;
  concurrency?: number;
}

interface StarWeek {
  week: number;
  total: number;
  days: number[];
}

export class StarHistoryError extends Error {
  readonly repo: string;
  readonly status: number;
  readonly rateLimited: boolean;

  constructor(repo: string, status: number, rateLimited: boolean) {
    super(`Failed to load star history of ${repo}: HTTP ${status}${rateLimited ? " (rate limited)" : ""}`);
    this.name = "StarHistoryError";
    this.repo = repo;
    this.status = status;
    this.rateLimited = rateLimited;
  }
}

export function isRepoName(value: string): boolean {
  return REPO_PATTERN.test(value);
}

async function requestPage(
  repo: string,
  page: number,
  options: StarHistoryOptions,
): Promise<{ weeks: StarWeek[]; link: string }> {
  const request = options.fetch ?? globalThis.fetch;
  const headers: Record<string, string> = {
    "accept": "application/vnd.github+json",
    "x-github-api-version": API_VERSION,
  };
  if (options.token) {
    headers.authorization = `Bearer ${options.token}`;
  }

  const res = await request(`${API}/repos/${repo}/stargazers/history?per_page=${PER_PAGE}&page=${page}`, { headers });
  if (!res.ok) {
    const limited = (res.status === 403 || res.status === 429)
      && (res.headers.get("x-ratelimit-remaining") === "0" || res.headers.has("retry-after"));
    throw new StarHistoryError(repo, res.status, limited);
  }
  return { weeks: await res.json() as StarWeek[], link: res.headers.get("link") ?? "" };
}

function accumulate(weeks: StarWeek[]): { stars: number; points: StarPoint[] } {
  const now = Date.now();
  const points: StarPoint[] = [];
  let stars = 0;

  for (const { week, days } of weeks) {
    for (const [i, added] of days.entries()) {
      const at = (week + i * DAY_SECONDS) * 1000;
      if (at > now) {
        break;
      }
      if (stars === 0 && added === 0) {
        continue;
      }
      stars += added;
      points.push({ date: new Date(at).toISOString().slice(0, 10), stars });
    }
  }

  return { stars, points };
}

export async function fetchStarHistory(repo: string, options: StarHistoryOptions = {}): Promise<StarHistory> {
  if (!isRepoName(repo)) {
    throw new TypeError(`Expected a repository as owner/name, got: ${repo}`);
  }

  const first = await requestPage(repo, 1, options);
  const lastPage = Number(LAST_PAGE_PATTERN.exec(first.link)?.[1] ?? 1);

  const pages: StarWeek[][] = [first.weeks];
  let next = 2;
  const worker = async (): Promise<void> => {
    while (next <= lastPage) {
      const page = next++;
      pages[page - 1] = (await requestPage(repo, page, options)).weeks;
    }
  };
  await Promise.all(Array.from({ length: options.concurrency ?? 6 }, worker));

  return { repo, ...accumulate(pages.flat().reverse()) };
}
