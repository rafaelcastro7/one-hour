"use client";

import Link from "next/link";
import { useLanguage } from "@/app/language-context";

export function SiteFooter() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <footer className="w-full border-t border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-4xl flex-col sm:flex-row items-center justify-between gap-3 px-6 py-6 text-xs text-neutral-500">
        <p>{es ? "1hour — regala una hora, recibe una hora. Voluntariado con IA." : "1hour — give an hour, get an hour. AI-matched volunteering."}</p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-amber-400 underline underline-offset-2">
            {es ? "Cómo funciona" : "How it works"}
          </Link>
          <Link href="/eval" className="hover:text-amber-400 underline underline-offset-2">
            {es ? "Precisión y costo" : "Accuracy & cost"}
          </Link>
          <a
            href="https://github.com/rafaelcastro7/one-hour"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 underline underline-offset-2"
          >
            {es ? "Código" : "Code"}
          </a>
        </div>
      </div>
    </footer>
  );
}
