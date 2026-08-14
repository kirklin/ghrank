import { readFileSync } from "node:fs";
import process from "node:process";
import { resolveLocation } from "./location.js";

const file = process.argv[2] ?? ".cache/ref-locations.json";
const locations = JSON.parse(readFileSync(file, "utf8")) as string[];

const byCountry = new Map<string, number>();
const missed: string[] = [];

for (const raw of locations) {
  const region = resolveLocation(raw);
  if (!region) {
    missed.push(raw);
    continue;
  }
  byCountry.set(region.country, (byCountry.get(region.country) ?? 0) + 1);
}

const resolved = locations.length - missed.length;
const pct = ((resolved / locations.length) * 100).toFixed(1);
console.warn(`样本 ${locations.length} 条，认出 ${resolved} 条（${pct}%），漏 ${missed.length} 条\n`);

console.warn("命中分布：");
for (const [code, n] of [...byCountry.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
  console.warn(`  ${code.padEnd(4)} ${n}`);
}

console.warn("\n没认出来的（去重后前 60 条）：");
for (const raw of [...new Set(missed)].slice(0, 60)) {
  console.warn(`  ${raw}`);
}
