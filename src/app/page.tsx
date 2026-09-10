"use client";

import Link from "next/link";
import { useLanguage } from "@/app/language-context";

export default function Home() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16 gap-14 text-center bg-neutral-950 text-neutral-50">
      <section className="max-w-xl space-y-4">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
          Burning Token · Applied AI
        </p>
        <h1 className="text-4xl font-bold tracking-tight">1hour</h1>
        <p className="text-neutral-400 text-lg">
          {es
            ? "Una hora dada. Una hora reclamada. Chatea para matchear — sin formularios."
            : "One hour given. One hour claimed. Chat to match — no forms."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto pt-2">
          <Link
            href="/request"
            className="flex-1 rounded-xl bg-amber-400 text-neutral-900 font-semibold px-6 py-4 text-lg hover:bg-amber-300 transition-colors"
          >
            {es ? "Necesito ayuda" : "Need help"}
          </Link>
          <Link
            href="/offer"
            className="flex-1 rounded-xl border-2 border-neutral-700 text-neutral-100 font-semibold px-6 py-4 text-lg hover:border-amber-400 transition-colors"
          >
            {es ? "Quiero ayudar" : "Offer help"}
          </Link>
        </div>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          {es
            ? "Tech e idiomas primero. Matcheado por IA (Nebius Token Factory). Métricas en vivo en /eval."
            : "Tech & languages first. Matched by AI (Nebius Token Factory). Metrics live at /eval."}
        </p>
      </section>

      <section className="w-full max-w-3xl grid sm:grid-cols-3 gap-4 text-left" aria-label="How it works">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <p className="font-semibold">{es ? "1. Chatea, no llenes" : "1. Chat, don't fill"}</p>
          <p className="text-sm text-neutral-400">
            {es
              ? "El agente estructura tu necesidad al instante — sin formularios."
              : "The agent structures your need instantly — no forms."}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <p className="font-semibold">{es ? "2. Embed + Rerank" : "2. Embed + Rerank"}</p>
          <p className="text-sm text-neutral-400">
            {es
              ? "Qwen3-Embedding-8B encuentra el top-3; Qwen3-30B elige al ganador."
              : "Qwen3-Embedding-8B finds the top-3; Qwen3-30B picks the winner."}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <p className="font-semibold">{es ? "3. Video en vivo" : "3. Live video"}</p>
          <p className="text-sm text-neutral-400">
            {es
              ? "Una sala Daily.co se abre al confirmar. Humanos aprueban voluntarios primero."
              : "A Daily.co room opens on confirm. Humans approve volunteers first."}
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-neutral-500" aria-label="Evidence">
        <Link href="/eval" className="hover:text-amber-400 underline underline-offset-2">
          {es ? "Precisión, latencia y costo" : "Accuracy, latency & cost"}
        </Link>
        <Link href="/about" className="hover:text-amber-400 underline underline-offset-2">
          {es ? "Cómo funciona" : "How it works"}
        </Link>
        <Link href="/admin" className="hover:text-amber-400 underline underline-offset-2">
          {es ? "Aprobación de voluntarios" : "Volunteer approval"}
        </Link>
      </section>
    </main>
  );
}
