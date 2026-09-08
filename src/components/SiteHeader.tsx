"use client";

import Link from "next/link";
import { LanguageSelectorButton, useLanguage } from "@/app/language-context";

const NAV: Record<"en" | "es", Record<string, string>> = {
  en: { about: "About", volunteers: "Volunteers", groups: "Groups", communities: "Communities", sessions: "Sessions", judges: "Judges", evidence: "Evidence", getHelp: "Get help" },
  es: { about: "Nosotros", volunteers: "Voluntarios", groups: "Grupos", communities: "Comunidades", sessions: "Sesiones", judges: "Jurado", evidence: "Evidencia", getHelp: "Pedir ayuda" },
};

export function SiteHeader() {
  const { language } = useLanguage();
  const t = NAV[language];
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4" aria-label="Main">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-50">
          1hour
        </Link>
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <Link href="/about" className="hover:text-amber-400 transition-colors">
            {t.about}
          </Link>
          <Link href="/volunteers" className="hover:text-amber-400 transition-colors">
            {t.volunteers}
          </Link>
          <Link href="/groups" className="hover:text-amber-400 transition-colors">
            {t.groups}
          </Link>
          <Link href="/communities" className="hover:text-amber-400 transition-colors">
            {t.communities}
          </Link>
          <Link href="/sessions" className="hover:text-amber-400 transition-colors">
            {t.sessions}
          </Link>
          <Link href="/jury" className="hover:text-amber-400 transition-colors">
            {t.judges}
          </Link>
          <Link href="/eval" className="hover:text-amber-400 transition-colors">
            {t.evidence}
          </Link>
          <Link
            href="/request"
            className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-900 hover:bg-amber-300 transition-colors"
          >
            {t.getHelp}
          </Link>
          <LanguageSelectorButton />
        </div>
      </nav>
    </header>
  );
}
