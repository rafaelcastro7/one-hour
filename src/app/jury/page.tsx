"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "@/app/language-context";

export default function JuryPage() {
  const results = useQuery(api.evaluation.listResults);
  const { language } = useLanguage();
  const es = language === "es";

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-10 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl w-full space-y-3 text-center">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
          {es ? "Para el jurado · tour de 2 minutos" : "For judges · 2-minute tour"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{es ? "1hour — briefing del jurado" : "1hour — judge briefing"}</h1>
        <p className="text-sm text-neutral-400">
          {es
            ? "Todo lo de abajo está medido en el pipeline en vivo, no afirmado. Pruébalo tú primero, luego lee la evidencia."
            : "Everything below is measured on the live pipeline, not asserted. Try it yourself first, then read the evidence."}
        </p>
      </div>

      <section className="w-full max-w-2xl rounded-xl border border-amber-400/40 bg-neutral-900 p-6 space-y-3">
        <h2 className="font-semibold">{es ? "Pruébalo en 2 minutos" : "Try it in 2 minutes"}</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-300">
          <li>
            <Link href="/request" className="text-amber-400 underline">{es ? "Pide ayuda" : "Request help"}</Link> — {es ? "escribe en español para ver la detección de idioma (responde en tu idioma)." : "write a need in Spanish to see language detection (it answers in your language)."}
          </li>
          <li>{es ? "Mira las etapas en vivo + tips mientras corre el matching (~20–35s)." : "Watch the live stages + tips while matching runs (~20–35s)."}</li>
          <li>
            {es ? "Confirma el match para generar una sala Daily.co real." : "Confirm the match to generate a real Daily.co video room."}
          </li>
          <li>
            {es ? "O " : "Or "}<Link href="/offer" className="text-amber-400 underline">{es ? "regístrate como voluntario" : "register as a volunteer"}</Link> {es ? "y mira la puerta humana en " : "and see the human approval gate in "}<Link href="/admin" className="text-amber-400 underline">/admin</Link>.
          </li>
        </ol>
      </section>

      <section className="w-full max-w-2xl space-y-3">
        <h2 className="font-semibold text-center">{es ? "Métricas en vivo (backend productivo)" : "Live metrics (production backend)"}</h2>
        {results ? (
          <div className="grid grid-cols-3 gap-4">
            <Kpi
              label={es ? "Precisión de ruteo" : "Routing accuracy"}
              value={results.accuracy !== null ? `${(results.accuracy * 100).toFixed(0)}%` : "—"}
              sub={es ? `${results.correct}/${results.totalEvaluated} casos etiquetados` : `${results.correct}/${results.totalEvaluated} labelled cases`}
            />
            <Kpi
              label={es ? "Latencia prom." : "Avg latency"}
              value={results.avgLatencyMs !== null ? `${(results.avgLatencyMs / 1000).toFixed(1)}s` : "—"}
              sub={es ? "pipeline completo por match" : "full pipeline per match"}
            />
            <Kpi
              label={es ? "Tokens prom." : "Avg tokens"}
              value={results.avgTokens !== null ? Math.round(results.avgTokens).toLocaleString() : "—"}
              sub={es ? "por match, todas las llamadas LLM" : "per match, all LLM calls"}
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center">{es ? "Cargando resultados en vivo…" : "Loading live results…"}</p>
        )}
        <p className="text-xs text-neutral-500 text-center">
          {es ? "Fuente: " : "Source: "}<Link href="/eval" className="underline hover:text-amber-400">/eval</Link> {es ? "— set etiquetado contra el pipeline Nebius real (llamadas reales, sin mocks)." : "— labelled set run against the real Nebius pipeline (real API calls, no mocks)."}
        </p>
      </section>

      <section className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-2">
        <h2 className="font-semibold">{es ? "Por qué esto no es un wrapper LLM" : "Why this is not an LLM wrapper"}</h2>
        <p className="text-sm text-neutral-300">
          {es
            ? "Retrieve-then-rerank: un embedding (Qwen3-Embedding-8B) reduce el pool al top-3 por similitud coseno, luego Llama-3.3-70B (Nebius Token Factory) decide al final y puede contradecir la similitud cuando el texto muestra que el más cercano está mal. La división de modelos es una decisión deliberada de costo/latencia: el grande juzga una vez, el barato escanea a todos."
            : "Retrieve-then-rerank: an embedding (Qwen3-Embedding-8B) narrows the pool to the top-3 by cosine similarity, then Llama-3.3-70B (Nebius Token Factory) makes the final call and can overrule similarity when the text shows the closest match is wrong. Model split is a deliberate cost/latency decision: the large model judges once, the cheap one scans everyone."}
        </p>
      </section>

      <section className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-2">
        <h2 className="font-semibold">{es ? "Lo rompimos, luego lo arreglamos (verificado)" : "We broke it, then fixed it (verified)"}</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
          <li>
            {es
              ? "Inyección de prompts (OWASP LLM01) secuestró el matching por completo — corregido con etiquetas opacas, texto no confiable acotado y validación de etiquetas."
              : "Prompt injection (OWASP LLM01) hijacked matching outright — fixed with opaque labels, fenced untrusted text, and label validation."}
          </li>
          <li>
            {es
              ? "Keyword stuffing llegó al rank #2 por similitud — corregido con penalización de amplitud en el scorer compartido; el atacante ya no llega al top-3."
              : "Keyword stuffing reached rank #2 on similarity — fixed with a breadth penalty in the shared scorer; attacker no longer reaches top-3."}
          </li>
          <li>
            {es
              ? "Negativo duro demostrado: retrieval se equivoca, el reranker elige al voluntario legítimo desde el score más bajo y nombra la manipulación."
              : "Hard negative demonstrated: retrieval wrong, reranker picks the legitimate volunteer from the lowest score and names the manipulation."}
          </li>
        </ul>
      </section>

      <section className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-2">
        <h2 className="font-semibold">{es ? "Límites honestos" : "Honest limits"}</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
          <li>{es ? "La reciprocidad es parcial: el control de congestión reparte carga y los voluntarios definen disponibilidad, pero la preferencia del voluntario no está del todo modelada." : "Reciprocity is partial: congestion control spreads load and volunteers set availability, but volunteer-side preference is not fully modelled."}</li>
          <li>{es ? "Auditoría de sesgo lingüístico: sin cambio de rank en 5/5 pares, pero lo no-nativo puntúa 2–7 pts menos, consistentemente — compensado con bonus léxico, no borrado." : "Linguistic-bias audit: no rank change in 5/5 pairs, but non-native scores 2–7 pts lower, consistently — offset by a lexical grounding bonus, not erased."}</li>
          <li>{es ? "La aprobación manual veta al voluntario, no la sesión — mitigado con pantalla de seguridad previa, no resuelto." : "Manual approval vets the volunteer, not the session — mitigated with a pre-session safety screen, not solved."}</li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-neutral-500">
        <a
          href="https://github.com/rafaelcastro7/one-hour"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-400 underline underline-offset-2"
        >
          {es ? "Código y write-up" : "Code & write-up"}
        </a>
        <Link href="/eval" className="hover:text-amber-400 underline underline-offset-2">
          {es ? "Dashboard de eval completo" : "Full eval dashboard"}
        </Link>
        <Link href="/about" className="hover:text-amber-400 underline underline-offset-2">
          {es ? "Nosotros" : "About"}
        </Link>
      </section>
    </main>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-neutral-400 mt-1">{label}</p>
      <p className="text-xs text-neutral-600">{sub}</p>
    </div>
  );
}
