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
            ? "Un hub de voluntariado con IA. Una hora dada, una hora que puedes reclamar — sin el cuello de botella de la coordinación manual."
            : "An AI-matched volunteering hub. One hour given, one hour you can claim — without the manual coordination bottleneck."}
        </p>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">{es ? "Cómo funciona el matching" : "How matching works"}</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300">
            <li>{es ? "Describes lo que necesitas u ofreces, en conversación — no un formulario." : "You describe what you need or offer, in conversation — not a form."}</li>
            <li>{es ? "El agente lo cierra en un perfil estructurado (categoría, urgencia, resumen)." : "The agent closes it into a structured profile (category, urgency, summary)."}</li>
            <li>{es ? "Ese resumen se convierte en embedding (Qwen3-Embedding-8B) y se compara por similitud coseno." : "That summary is embedded (Qwen3-Embedding-8B) and compared by cosine similarity."}</li>
            <li>{es ? "Los 3 mejores van a una segunda llamada LLM (Qwen3-30B) que elige y explica por qué." : "Top-3 candidates go to a second LLM call (Qwen3-30B) that picks and explains why."}</li>
            <li>{es ? "Al confirmar, se crea en vivo una sala Daily.co en ambas pantallas — o, para la voluntaria IA, un chat instantáneo con Aria." : "On confirm, a Daily.co video room is created live on both screens — or, for the AI volunteer, an instant Aria chat opens instead."}</li>
          </ol>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">{es ? "Medido, no afirmado" : "Measured, not claimed"}</h2>
          <p className="text-sm text-neutral-300">
            {es ? (
              <>La eval en vivo en <Link href="/eval" className="text-amber-400 underline">/eval</Link> corre un set etiquetado contra el pipeline real — precisión de ruteo, segundos por match y tokens por match, medidos en vivo. Un harness red-team encontró una inyección de prompts funcional y un ataque de keyword-stuffing — ambos corregidos y con tests de regresión.</>
            ) : (
              <>The live eval at <Link href="/eval" className="text-amber-400 underline">/eval</Link> runs a labelled set against the real pipeline — routing accuracy, seconds per match and tokens per match, measured live rather than asserted. A red-team harness found a working prompt injection and a keyword-stuffing attack — both fixed and regression-tested.</>
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
