"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useLanguage } from "@/app/language-context";

export default function EvalPage() {
  const results = useQuery(api.evaluation.listResults);
  const runEvaluation = useMutation(api.evaluation.runEvaluation);
  const { language } = useLanguage();
  const es = language === "es";
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const baselineRef = useRef<Record<string, number | undefined>>({});

  const completedThisRun = useMemo(() => {
    if (!running || !results) return 0;
    return results.cases.filter(
      (item) => item.lastRunAt !== undefined && item.lastRunAt !== baselineRef.current[item._id]
    ).length;
  }, [results, running]);

  useEffect(() => {
    if (running && results && results.cases.length > 0 && completedThisRun === results.cases.length) {
      setRunning(false);
    }
  }, [completedThisRun, results, running]);

  useEffect(() => {
    if (!running) return;
    const timeout = window.setTimeout(() => {
      setRunning(false);
      setRunError(es
        ? "La evaluación tardó demasiado. Los casos terminados siguen guardados; puedes reintentar los demás."
        : "The evaluation took too long. Completed cases are saved; you can retry the rest.");
    }, 120_000);
    return () => window.clearTimeout(timeout);
  }, [es, running]);

  async function run() {
    if (running) return;
    setRunning(true);
    setRunError(null);
    baselineRef.current = Object.fromEntries(
      (results?.cases ?? []).map((item) => [item._id, item.lastRunAt])
    );
    try {
      await runEvaluation();
      // Completion is detected reactively above as each case gets a new
      // lastRunAt value. The button becomes usable again when all finish.
    } catch {
      setRunError(es ? "No se pudo iniciar la evaluación. Inténtalo de nuevo." : "Couldn't start the evaluation. Try again.");
      setRunning(false);
      return;
    }
  }

  const adversarial = results?.cases.find((c) => c.isAdversarial);

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl text-center space-y-2">
        <h1 className="text-2xl font-bold">{es ? "Precisión, latencia y costo del matching" : "Matching accuracy, latency & cost"}</h1>
        <p className="text-sm text-neutral-400">
          {results
            ? es
              ? `${results.cases.length} casos etiquetados vs el pipeline Nebius en vivo (llamadas reales, no mocks): detección de categoría, similitud por embeddings y la capa de decisión LLM sobre el top-3.`
              : `${results.cases.length} labelled cases vs the live Nebius pipeline (real API calls, no mocks): category detection, embedding similarity, and the LLM decision layer over the top-3.`
            : es
              ? "Casos etiquetados vs el pipeline Nebius en vivo (llamadas reales, no mocks)."
              : "Labelled cases vs the live Nebius pipeline (real API calls, no mocks)."}
        </p>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3 disabled:opacity-50"
      >
        {running
          ? es
            ? `Corriendo contra Nebius… ${completedThisRun}/${results?.cases.length ?? 0}`
            : `Running against Nebius… ${completedThisRun}/${results?.cases.length ?? 0}`
          : es ? "Correr evaluación ahora" : "Run evaluation now"}
      </button>
      {runError && (
        <p className="text-sm text-red-300" role="alert">{runError}</p>
      )}

      {results && (
        <div className="w-full max-w-2xl grid grid-cols-3 gap-4">
          <Kpi
            label={es ? "Precisión" : "Accuracy"}
            value={results.accuracy !== null ? `${(results.accuracy * 100).toFixed(0)}%` : "—"}
            sub={es ? `${results.correct}/${results.totalEvaluated} casos` : `${results.correct}/${results.totalEvaluated} cases`}
          />
          <Kpi
            label={es ? "Latencia prom." : "Avg. latency"}
            value={results.avgLatencyMs !== null ? `${(results.avgLatencyMs / 1000).toFixed(1)}s` : "—"}
            sub={es ? "pipeline completo por match" : "full pipeline per match"}
          />
          <Kpi
            label={es ? "Tokens prom." : "Avg. tokens"}
            value={results.avgTokens !== null ? Math.round(results.avgTokens).toLocaleString() : "—"}
            sub={es ? "por match, las 3 llamadas LLM" : "per match, all 3 LLM calls"}
          />
        </div>
      )}

      {adversarial && adversarial.lastRunAt && (
        <div className="w-full max-w-2xl bg-neutral-900 border border-amber-400/40 rounded-xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-wide text-amber-400 font-semibold">
            {es ? "Caso adversarial — retrieval vs. reranker" : "Adversarial case — retrieval vs. reranker"}
          </p>
          {adversarial.topCandidateByCosineOnly === adversarial.chosenByLLM && (
            <p className="text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              {es
                ? "En esta corrida ambas etapas eligieron al mismo voluntario: retrieval acertó solo y el reranker estuvo de acuerdo. Aún no construimos un caso donde retrieval falle de verdad — este panel es el harness para eso, y muestra el acuerdo con honestidad en vez de implicar un rescate que no ocurrió."
                : "On this run both stages picked the same volunteer: retrieval got it right on its own and the reranker agreed. We have not yet built a case where retrieval genuinely fails — this panel is the harness for that, and shows agreement honestly rather than implying a save that didn't happen."}
            </p>
          )}
          <p className="text-sm text-neutral-300">{adversarial.needText}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-700 rounded-lg p-4">
              <p className="text-xs text-neutral-400 font-semibold mb-1">
                {es ? "Solo retrieval (top coseno)" : "Retrieval alone (top cosine match)"}
              </p>
              <p className="text-sm text-neutral-300">{adversarial.topCandidateByCosineOnly}</p>
            </div>
            <div className="bg-neutral-950 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-xs text-emerald-400 font-semibold mb-1">
                {es ? "Tras re-ranking LLM" : "After LLM reranking"}
              </p>
              <p className="text-sm text-neutral-300">{adversarial.chosenByLLM}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            {es ? "Por qué: " : "Why: "}{adversarial.llmReasoning}
          </p>
        </div>
      )}

      {results && (
        <div className="w-full max-w-2xl flex flex-col gap-2">
          {results.cases.map((c) => (
            <div
              key={c._id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm flex justify-between gap-4"
            >
              <span className="text-neutral-400 flex-1">{c.needText.slice(0, 90)}...</span>
              <span
                className={
                  c.wasCorrect === true
                    ? "text-emerald-400"
                    : c.wasCorrect === false
                      ? "text-red-400"
                      : "text-neutral-600"
                }
              >
                {c.wasCorrect === undefined ? (es ? "sin correr" : "not run") : c.wasCorrect ? (es ? "correcto" : "correct") : (es ? "falló" : "wrong")}
              </span>
            </div>
          ))}
        </div>
      )}
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
