import { Buffer } from "node:buffer";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gzipSync } from "node:zlib";

export function writeJson(path: string, data: unknown): { bytes: number; gzipped: number } {
  mkdirSync(dirname(path), { recursive: true });
  const json = JSON.stringify(data);
  writeFileSync(path, json);
  return { bytes: Buffer.byteLength(json), gzipped: gzipSync(json).length };
}

export function human(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
