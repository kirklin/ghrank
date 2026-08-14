"use client";

import { useLang } from "./LangProvider";

export function Delta({ value, isNew }: { value: number | null; isNew?: boolean }) {
  const { tr } = useLang();
  if (isNew) {
    return <span className="move new">{tr("badge.new")}</span>;
  }
  if (value === null || value === 0) {
    return null;
  }
  return (
    <span className={`move ${value > 0 ? "up" : "down"}`}>
      {value > 0 ? "↑" : "↓"}
      {Math.abs(value)}
    </span>
  );
}
