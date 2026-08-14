"use client";

import { languageIcon } from "~/lib/lang-icons";

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const r = Number.parseInt(v.slice(0, 2), 16) / 255;
  const g = Number.parseInt(v.slice(2, 4), 16) / 255;
  const b = Number.parseInt(v.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function LangMark({ name, size = 15 }: { name: string | null; size?: number }) {
  const icon = languageIcon(name);
  if (!icon) {
    return null;
  }

  const l = luminance(icon.hex);
  const fill = l < 0.14 || l > 0.86 ? "currentColor" : icon.hex;

  if (!icon.path) {
    return (
      <span
        className="dot"
        style={{ background: fill === "currentColor" ? undefined : icon.hex, width: size - 6, height: size - 6 }}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} aria-hidden="true">
      <path d={icon.path} />
    </svg>
  );
}

export function LangLabel({ name }: { name: string | null }) {
  if (!name) {
    return <span className="dim">—</span>;
  }
  return (
    <span className="lang-cell">
      <LangMark name={name} />
      <span className="ellipsis">{name}</span>
    </span>
  );
}
