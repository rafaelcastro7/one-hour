"use client";

import Link from "next/link";
import { useLanguage } from "@/app/language-context";

export default function AboutPage() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-10 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl w-full space-y-4 text-left">
        <h1 className="text-3xl font-bold tracking-tight text-center">{es ? "Acerca de 1hour" : "About 1hour"}</h1>
        <p className="text-neutral-400 text-center">
          {es
            ? "Voluntariado matcheado por IA. Una hora dada, una hora reclamada. Sin cuellos de botella."
            : "AI-matched volunteering. One hour given, one hour claimed. No coordination bottleneck."}
        </p>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">{es ? "Cómo funciona el matching" : "How matching works"}</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300">
            <li>{es ? "Describe tu necesidad u oferta en chat — no un formulario." : "Describe your need or offer in chat — not a form."}</li>
            <li>{es ? "El agente lo estructura en un perfil (categoría, urgencia, resumen)." : "The agent structures it into a profile (category, urgency, summary)."}</li>
            <li>{es ? "Qwen3-Embedding-8B lo convierte en embedding y compara por similitud coseno." : "Qwen3-Embedding-8B embeds it and compares by cosine similarity."}</li>
            <li>{es ? "El top-3 lo decide Qwen3-30B (Nebius), que elige y explica por qué." : "Qwen3-30B (Nebius) decides the top-3 pick and explains why."}</li>
            <li>{es ? "Al confirmar se abre una sala Daily.co en vivo en ambas pantallas — o un chat instantáneo con Aria, la voluntaria IA." : "On confirm, a live Daily.co room opens on both screens — or an instant Aria chat, the AI volunteer."}</li>
          </ol>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">{es ? "Medido, no afirmado" : "Measured, not claimed"}</h2>
          <p className="text-sm text-neutral-300">
            {es ? (
              <>La eval en vivo en <Link href="/eval" className="text-amber-400 underline">/eval</Link> corre casos etiquetados contra el pipeline real — precisión, latencia y tokens medidos en vivo. El red-team corrigió una inyección de prompts y un keyword-stuffing, con tests de regresión.</>
            ) : (
              <>The live eval at <Link href="/eval" className="text-amber-400 underline">/eval</Link> runs labelled cases against the real pipeline — accuracy, latency and tokens measured live. A red-team fixed a prompt injection and keyword-stuffing, both regression-tested.</>
            )}
          </p>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">{es ? "Seguridad y límites" : "Safety and limits"}</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300">
            <li>{es ? "Cada voluntario pasa una puerta humana antes de activarse." : "Every volunteer passes a human approval gate before activation."}</li>
            <li>{es ? "El flujo abre con límite de rol + ruteo de crisis (findahelpline.com)." : "Request flow opens with a role boundary + crisis routing (findahelpline.com)."}</li>
            <li>{es ? "Categorías de lanzamiento: tech e idiomas — bajo riesgo por diseño." : "Launch categories are tech and languages — low-risk by design."}</li>
            <li>{es ? "El matching optimiza utilidad unilateral hoy; la equidad recíproca y el sesgo se auditan abiertamente." : "Matching optimizes one-sided utility today; reciprocal fairness and bias are audited openly."}</li>
          </ul>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link
            href="/request"
            className="rounded-xl bg-amber-400 text-neutral-900 font-semibold px-6 py-3 text-center hover:bg-amber-300 transition-colors"
          >
            {es ? "Pruébalo — necesito ayuda" : "Try it — I need help"}
          </Link>
          <Link
            href="/offer"
            className="rounded-xl border-2 border-neutral-700 px-6 py-3 text-center font-semibold hover:border-amber-400 transition-colors"
          >
            {es ? "Ofrece una hora" : "Offer an hour"}
          </Link>
        </div>
      </div>
    </main>
  );
}
