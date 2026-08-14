import table from "./locations.json" with { type: "json" };

export interface Region {
  country: string;
  countryName: string;
  countryNameZh: string;
  city: string | null;
  province: string | null;
  provinceZh: string | null;
}

interface Entry {
  alias: string;
  country: string;
  city: string | null;
  province: string | null;
  weight: number;
  ascii: boolean;
}

interface CountryEntry {
  name: string;
  nameZh: string;
  aliases: string[];
  cities?: Record<string, string[]>;
  provinces?: Record<string, string[]>;
  cityProvince?: Record<string, string>;
  provinceZh?: Record<string, string>;
}

const countries = table as unknown as Record<string, CountryEntry>;

export function normalize(raw: string): string {
  return raw
    .normalize("NFKD")
    .toLowerCase()
    .replace(/\p{M}+/gu, "")
    .replace(/[，、]/g, ",")
    .replace(/\s+/g, " ")
    .trim();
}

const index: Entry[] = [];

for (const [code, entry] of Object.entries(countries)) {
  for (const alias of entry.aliases) {
    index.push({ alias: normalize(alias), country: code, city: null, province: null, weight: 3, ascii: isAscii(alias) });
  }

  for (const [province, aliases] of Object.entries(entry.provinces ?? {})) {
    for (const alias of aliases) {
      index.push({ alias: normalize(alias), country: code, city: null, province, weight: 2, ascii: isAscii(alias) });
    }
  }

  for (const [city, aliases] of Object.entries(entry.cities ?? {})) {
    const province = entry.cityProvince?.[city] ?? null;
    for (const alias of aliases) {
      index.push({ alias: normalize(alias), country: code, city, province, weight: 1, ascii: isAscii(alias) });
    }
  }
}

index.sort((a, b) => b.alias.length - a.alias.length || b.weight - a.weight);

function isAscii(value: string): boolean {
  return /^[\w\s'.,-]+$/.test(value);
}

const patterns = new Map<string, RegExp>();

function matcher(alias: string): RegExp {
  const cached = patterns.get(alias);
  if (cached) {
    return cached;
  }

  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const head = /^[a-z0-9]/.test(alias) ? "(?<![a-z0-9])" : "";
  const tail = /[a-z0-9]$/.test(alias) ? "(?![a-z0-9])" : "";
  const re = new RegExp(`${head}${escaped}${tail}`);
  patterns.set(alias, re);
  return re;
}

function hit(text: string, entry: Entry): boolean {
  if (!entry.ascii) {
    return text.includes(entry.alias);
  }
  return matcher(entry.alias).test(text);
}

const EXACT: Record<string, [string, string | null]> = {
  sf: ["US", "San Francisco"],
  ny: ["US", "New York"],
  nyc: ["US", "New York"],
  la: ["US", "Los Angeles"],
  atx: ["US", "Austin"],
  pdx: ["US", "Portland"],
  sea: ["US", "Seattle"],
  bj: ["CN", "Beijing"],
  sh: ["CN", "Shanghai"],
  sz: ["CN", "Shenzhen"],
  hz: ["CN", "Hangzhou"],
  ...bareCountryCodes(),
};

function bareCountryCodes(): Record<string, [string, string | null]> {
  const codes = [
    "US",
    "GB",
    "FR",
    "DE",
    "JP",
    "CN",
    "BR",
    "NL",
    "SE",
    "CH",
    "ES",
    "IT",
    "PL",
    "RU",
    "TR",
    "MX",
    "VN",
    "TH",
    "PH",
    "SG",
    "HK",
    "TW",
    "KR",
    "NZ",
    "ZA",
    "NG",
    "KE",
    "EG",
    "PK",
    "BD",
    "NP",
    "LK",
    "AE",
    "SA",
    "UA",
    "CZ",
    "HU",
    "RO",
    "GR",
    "PT",
    "DK",
    "FI",
    "NO",
    "IE",
    "AT",
    "BE",
    "IN",
  ];
  const map: Record<string, [string, string | null]> = {};
  for (const code of codes) {
    map[code.toLowerCase()] = [code, null];
  }
  map.uk = ["GB", null];
  return map;
}

const cache = new Map<string, Region | null>();

export function resolveLocation(raw: string | null | undefined): Region | null {
  if (!raw) {
    return null;
  }

  const text = normalize(raw);
  if (!text) {
    return null;
  }

  const cached = cache.get(text);
  if (cached !== undefined) {
    return cached;
  }

  let country: string | null = null;
  let city: string | null = null;
  let province: string | null = null;

  const exact = EXACT[text];
  if (exact) {
    [country, city] = exact;
  }

  for (const entry of country ? [] : index) {
    if (!hit(text, entry)) {
      continue;
    }
    country ??= entry.country;
    if (entry.country !== country) {
      continue;
    }
    city ??= entry.city;
    province ??= entry.province;
    if (city && province) {
      break;
    }
  }

  if (country && city && !province) {
    province = countries[country]?.cityProvince?.[city] ?? null;
  }

  const result = country
    ? {
        country,
        countryName: countries[country]!.name,
        countryNameZh: countries[country]!.nameZh,
        city,
        province,
        provinceZh: province ? countries[country]?.provinceZh?.[province] ?? null : null,
      }
    : null;

  cache.set(text, result);
  return result;
}

export const GREATER_CHINA = ["CN", "HK", "MO", "TW"];

export function listCountries(): { code: string; name: string; nameZh: string }[] {
  return Object.entries(countries).map(([code, entry]) => ({
    code,
    name: entry.name,
    nameZh: entry.nameZh,
  }));
}
