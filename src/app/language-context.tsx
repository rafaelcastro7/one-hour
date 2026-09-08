"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AppLanguage = "en" | "es";

const LANG_KEY = "onehour-language";

export const SUPPORTED_LANGUAGES: Array<{ code: AppLanguage; label: string }> = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

function isAppLanguage(code: string | null): code is AppLanguage {
  return code === "en" || code === "es";
}

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (code: AppLanguage) => void;
  toggleLanguage: () => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default "en" on first render (SSR-safe); hydrate from localStorage after
  // mount so server and client render identically — no hydration mismatch.
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (isAppLanguage(stored) && stored !== "en") {
        setLanguageState(stored);
      }
    } catch {
      // Private mode / blocked storage: stay on English, still functional.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute("data-lang", language);
    try {
      window.localStorage.setItem(LANG_KEY, language);
    } catch {
      // Non-fatal: preference just won't persist.
    }
  }, [language]);

  const setLanguage = (code: AppLanguage) => {
    if (isAppLanguage(code)) setLanguageState(code);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === "en" ? "es" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>.");
  }
  return ctx;
}

export function LanguageSelectorButton() {
  const { language, toggleLanguage } = useLanguage();
  const next = language === "en" ? "ES" : "EN";
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={language === "en" ? "Cambiar a español" : "Switch to English"}
      title={language === "en" ? "Cambiar a español" : "Switch to English"}
      className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 hover:border-amber-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      {next}
    </button>
  );
}
