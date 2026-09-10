"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSelectorButton, useLanguage } from "@/app/language-context";

const NAV: Record<"en" | "es", Record<string, string>> = {
  en: { about: "About", volunteers: "Volunteers", judges: "Judges", evidence: "Evidence", demo: "Demo", getHelp: "Get help" },
  es: { about: "Nosotros", volunteers: "Voluntarios", judges: "Jurado", evidence: "Evidencia", demo: "Demo", getHelp: "Pedir ayuda" },
};

export function SiteHeader() {
  const { language } = useLanguage();
  const t = NAV[language];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const links = [
    ["/about", t.about],
    ["/volunteers", t.volunteers],
    ["/jury", t.judges],
    ["/eval", t.evidence],
    ["/demo", t.demo],
  ] as const;

  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950">
      <nav className="mx-auto max-w-4xl px-4 py-4 sm:px-6" aria-label="Main">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight text-neutral-50">
            1hour
          </Link>
          <div className="hidden items-center gap-4 text-sm text-neutral-400 md:flex">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-amber-400 transition-colors">
                {label}
              </Link>
            ))}
            <Link
              href="/request"
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-900 hover:bg-amber-300 transition-colors"
            >
              {t.getHelp}
            </Link>
            <LanguageSelectorButton />
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelectorButton />
            <button
              type="button"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={language === "es" ? "Abrir menú" : "Open menu"}
              onClick={() => setOpen((value) => !value)}
              className="rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-100 hover:border-amber-400"
            >
              {open ? "×" : "☰"}
            </button>
          </div>
        </div>
        {open && (
          <div id="mobile-navigation" className="grid grid-cols-2 gap-2 pt-4 text-sm text-neutral-300 md:hidden">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-neutral-900 hover:text-amber-400">
                {label}
              </Link>
            ))}
            <Link href="/request" className="rounded-lg bg-amber-400 px-3 py-2 text-center font-semibold text-neutral-900 hover:bg-amber-300">
              {t.getHelp}
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
