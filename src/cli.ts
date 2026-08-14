#!/usr/bin/env node
import process from "node:process";
import { getRepos, getReposByLanguage, getUsers, getUsersByCountry } from "./client.js";
import { resolveLocation } from "./location.js";

const HELP = `ghrank — GitHub developer and repository rankings

Usage
  ghrank users [--country <code>] [--limit <n>] [--json]
  ghrank repos [--language <name>] [--limit <n>] [--json]
  ghrank where "<location text>"

Options
  --country, -c   ISO 3166-1 code, e.g. cn, us, de
  --language, -l  Programming language, e.g. rust, "c++"
  --limit, -n     Rows to print (default 20)
  --json          Print raw JSON
  --endpoint      Override the data endpoint

Examples
  ghrank users -c cn -n 10
  ghrank repos -l rust
  ghrank where "福建省厦门市"
`;

function arg(argv: string[], ...names: string[]): string | undefined {
  for (const name of names) {
    const i = argv.indexOf(name);
    if (i !== -1 && argv[i + 1]) {
      return argv[i + 1];
    }
  }
  return undefined;
}

function pad(value: string | number, width: number, right = false): string {
  const text = String(value);
  const visible = [...text].reduce((n, c) => n + (/[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(c) ? 2 : 1), 0);
  const fill = " ".repeat(Math.max(0, width - visible));
  return right ? fill + text : text + fill;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "--help" || command === "-h") {
    process.stdout.write(HELP);
    return;
  }

  const limit = Number(arg(argv, "--limit", "-n") ?? 20);
  const json = argv.includes("--json");
  const endpoint = arg(argv, "--endpoint");
  const options = endpoint ? { endpoint } : {};

  if (command === "where") {
    const text = argv[1];
    if (!text) {
      throw new Error("Usage: ghrank where \"<location text>\"");
    }
    const region = resolveLocation(text);
    process.stdout.write(`${JSON.stringify(region, null, 2)}\n`);
    return;
  }

  if (command === "users") {
    const country = arg(argv, "--country", "-c");
    const rows = country
      ? await getUsersByCountry(country, options)
      : await getUsers(options);
    const shown = rows.slice(0, limit);
    if (json) {
      process.stdout.write(`${JSON.stringify(shown, null, 2)}\n`);
      return;
    }
    for (const u of shown) {
      process.stdout.write(
        `${pad(u.rank, 6, true)}  ${pad(u.login, 22)}${pad(u.followers.toLocaleString("en-US"), 9, true)}  ${u.city ?? u.country ?? ""}\n`,
      );
    }
    process.stdout.write(`\n${rows.length.toLocaleString("en-US")} developers\n`);
    return;
  }

  if (command === "repos") {
    const language = arg(argv, "--language", "-l");
    const rows = language
      ? await getReposByLanguage(language, options)
      : await getRepos(options);
    const shown = rows.slice(0, limit);
    if (json) {
      process.stdout.write(`${JSON.stringify(shown, null, 2)}\n`);
      return;
    }
    for (const r of shown) {
      process.stdout.write(
        `${pad(r.rank, 6, true)}  ${pad(r.fullName, 42)}${pad(r.stars.toLocaleString("en-US"), 9, true)}  ${r.language ?? ""}\n`,
      );
    }
    process.stdout.write(`\n${rows.length.toLocaleString("en-US")} repositories\n`);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${HELP}`);
}

main().catch((error: Error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
