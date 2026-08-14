"use client";

import type { Key, Lang } from "~/lib/i18n";
import { Languages } from "lucide-react";
import { createContext, use, useCallback, useEffect, useMemo, useState } from "react";
import { t } from "~/lib/i18n";

const STORAGE_KEY = "ghrank-lang";

interface Ctx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  tr: (key: Key, values?: Record<string, string | number>) => string;
}

const LangContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  tr: (key, values) => t(key, "en", values),
});

export function useLang(): Ctx {
  return use(LangContext);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setLang(
      stored === "zh" || stored === "en"
        ? stored
        : navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en",
    );
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  const persist = useCallback((next: Lang) => {
    setLang(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<Ctx>(() => ({
    lang,
    setLang: persist,
    tr: (key, values) => t(key, lang, values),
  }), [lang, persist]);

  return <LangContext value={value}>{children}</LangContext>;
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      className="icon-btn"
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
      title={lang === "en" ? "切换到中文" : "Switch to English"}
      aria-label={lang === "en" ? "切换到中文" : "Switch to English"}
    >
      <Languages size={16} strokeWidth={1.9} />
    </button>
  );
}
