"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";

export default function EvalPage() {
  const results = useQuery(api.evaluation.listResults);
  const runEvaluation = useMutation(api.evaluation.runEvaluation);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    await runEvaluation();
    setTimeout(() => setRunning(false), 15000);
  }

  const adversarial = results?.cases.find((c) => c.isAdversarial);

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl text-center space-y-2">
        <h1 className="text-2xl font-bold">Matching accuracy, latency & cost</h1>
        <p className="text-sm text-neutral-400">
          Ten labeled cases, run against the live Nebius pipeline (real API
          calls, not mocks) -- category detection, embedding similarity, and
          the LLM decision layer over the top-3 candidates.
        </p>
      </div>

      <button
        onClick={run}
        disabled={running}
        className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3 disabled:opacity-50"
      >
        {running ? "Running against live Nebius API..." : "Run evaluation now"}
      </button>

      {results && (
        <div className="w-full max-w-2xl grid grid-cols-3 gap-4">
          <Kpi
            label="Accuracy"
            value={results.accuracy !== null ? `${(results.accuracy * 100).toFixed(0)}%` : "—"}
            sub={`${results.correct}/${results.totalEvaluated} cases`}
          />
          <Kpi
            label="Avg. latency"
            value={results.avgLatencyMs !== null ? `${(results.avgLatencyMs / 1000).toFixed(1)}s` : "—"}
            sub="full pipeline per match"
          />
          <Kpi
            label="Avg. tokens"
            value={results.avgTokens !== null ? Math.round(results.avgTokens).toLocaleString() : "—"}
            sub="per match, all 3 LLM calls"
          />
        </div>
      )}

      {adversarial && adversarial.lastRunAt && (
        <div className="w-full max-w-2xl bg-neutral-900 border border-amber-400/40 rounded-xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-wide text-amber-400 font-semibold">
            Adversarial case -- where cosine similarity alone gets it wrong
          </p>
          <p className="text-sm text-neutral-300">{adversarial.needText}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-red-400 font-semibold mb-1">
                Pure cosine similarity would pick
              </p>
              <p className="text-sm text-neutral-300">{adversarial.topCandidateByCosineOnly}</p>
            </div>
            <div className="bg-neutral-950 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-xs text-emerald-400 font-semibold mb-1">
                LLM decision layer actually picks
              </p>
              <p className="text-sm text-neutral-300">{adversarial.chosenByLLM}</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500">
            Why: {adversarial.llmReasoning}
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
                {c.wasCorrect === undefined ? "not run" : c.wasCorrect ? "correct" : "wrong"}
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
