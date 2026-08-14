"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLang } from "./LangProvider";

const STORAGE_KEY = "ghrank-theme";

type Theme = "system" | "light" | "dark";

const ORDER: Theme[] = ["system", "light", "dark"];

const ICON = { system: Monitor, light: Sun, dark: Moon };

export default function ThemeSwitch() {
  const { tr } = useLang();
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]!;
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const Icon = ICON[theme];

  return (
    <button type="button" className="icon-btn" onClick={cycle} title={tr("theme.hint")} aria-label={tr("theme.hint")}>
      <Icon size={16} strokeWidth={1.9} />
    </button>
  );
}
