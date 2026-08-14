import { readFileSync } from "node:fs";
import { join } from "node:path";

const table = JSON.parse(
  readFileSync(join(process.cwd(), "..", "src", "locations.json"), "utf8"),
) as Record<string, { name: string; nameZh: string }>;

export function countryName(code: string): string {
  return table[code]?.nameZh ?? code;
}

export function countryNameEn(code: string): string {
  return table[code]?.name ?? code;
}

export function nameMap(): Record<string, { en: string; zh: string }> {
  const map: Record<string, { en: string; zh: string }> = {};
  for (const [code, entry] of Object.entries(table)) {
    map[code] = { en: entry.name, zh: entry.nameZh };
  }
  return map;
}

export function flag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) {
    return "";
  }
  return String.fromCodePoint(...[...code].map(c => 0x1F1A5 + c.charCodeAt(0)));
}
