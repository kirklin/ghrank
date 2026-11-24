import type { StarChartMode } from "./star-chart.js";
import type { StarHistory } from "./stars.js";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { token } from "./github.js";
import { renderStarChart } from "./star-chart.js";
import { fetchStarHistory, isRepoName } from "./stars.js";

const CONFIG = "charts.json";
const OUT = "web/public/chart";
const NAME_PATTERN = /^[\w.-]+(?:\/[\w.-]+)*$/;

interface ChartEntry {
  repos: string[];
  name?: string;
  mode?: StarChartMode;
  log?: boolean;
}

function outputName(entry: ChartEntry): string {
  if (!Array.isArray(entry.repos) || entry.repos.length === 0 || !entry.repos.every(isRepoName)) {
    throw new Error(`${CONFIG}：repos 必须是 owner/name 组成的数组，收到 ${JSON.stringify(entry.repos)}`);
  }
  if (entry.repos.length > 1 && !entry.name) {
    throw new Error(`${CONFIG}：多个仓库画在一张图里时必须写 name，${entry.repos.join(", ")}`);
  }
  const name = (entry.name ?? entry.repos[0]!).toLowerCase();
  if (!NAME_PATTERN.test(name)) {
    throw new Error(`${CONFIG}：name 只能用字母、数字、点、横线、下划线和斜杠，收到 ${name}`);
  }
  return name;
}

async function main(): Promise<void> {
  const entries = JSON.parse(readFileSync(CONFIG, "utf8")) as ChartEntry[];
  const names = entries.map(outputName);
  const histories = new Map<string, Promise<StarHistory>>();
  const authToken = token();

  for (const [i, entry] of entries.entries()) {
    const data = await Promise.all(entry.repos.map((repo) => {
      const key = repo.toLowerCase();
      if (!histories.has(key)) {
        histories.set(key, fetchStarHistory(repo, { token: authToken }));
      }
      return histories.get(key)!;
    }));

    const base = join(OUT, names[i]!);
    mkdirSync(dirname(base), { recursive: true });
    for (const theme of ["light", "dark"] as const) {
      const { svg } = renderStarChart(data, { mode: entry.mode, log: entry.log, theme });
      writeFileSync(theme === "light" ? `${base}.svg` : `${base}.dark.svg`, svg);
    }
    console.warn(`  ${names[i]}：${data.map(h => `${h.repo} ${h.stars}`).join("，")}`);
  }

  console.warn(`完成：${entries.length} 张 Star 历史图，输出到 ${OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
