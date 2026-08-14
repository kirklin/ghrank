import type { RankedUser } from "./types.js";
import { readFileSync } from "node:fs";
import process from "node:process";
import { writeJson } from "./io.js";
import { resolveLocation } from "./location.js";

function main(): void {
  const path = "data/users.json";
  const users = JSON.parse(readFileSync(path, "utf8")) as RankedUser[];

  let changed = 0;
  const updated = users.map((u) => {
    const region = resolveLocation(u.location);
    const country = region?.country ?? null;
    const city = region?.city ?? null;
    const province = region?.province ?? null;
    if (country !== u.country || city !== u.city || province !== u.province) {
      changed++;
    }
    return { ...u, country, city, province, provinceZh: region?.provinceZh ?? null };
  });

  writeJson(path, updated);

  const stated = updated.filter(u => u.location).length;
  const resolved = updated.filter(u => u.country).length;
  const before = users.filter(u => u.country).length;

  console.warn(`改动 ${changed} 条`);
  console.warn(`认出 ${before} → ${resolved} 人（填了 location 的共 ${stated} 人，${((resolved / stated) * 100).toFixed(1)}%）`);
}

try {
  main();
} catch (error) {
  console.error(`跑不动，先确认 data/users.json 存在：${(error as Error).message}`);
  process.exit(1);
}
