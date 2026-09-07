"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";

export default function JuryPage() {
  const results = useQuery(api.evaluation.listResults);

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-10 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl w-full space-y-3 text-center">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
          For judges · 2-minute tour
        </p>
        <h1 className="text-3xl font-bold tracking-tight">1hour — judge briefing</h1>
        <p className="text-sm text-neutral-400">
          Everything below is measured on the live pipeline, not asserted.
          Try it yourself first, then read the evidence.
        </p>
      </div>

      <section className="w-full max-w-2xl rounded-xl border border-amber-400/40 bg-neutral-900 p-6 space-y-3">
        <h2 className="font-semibold">Try it in 2 minutes</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-neutral-300">
          <li>
            <Link href="/request" className="text-amber-400 underline">Request help</Link> — write a need in Spanish
            to see language detection (it answers in your language).
          </li>
          <li>Watch the live stages + tips while matching runs (~20–35s).</li>
          <li>
            Confirm the match to generate a real Daily.co video room.
          </li>
          <li>
            Or <Link href="/offer" className="text-amber-400 underline">register as a volunteer</Link> and see
            the human approval gate in <Link href="/admin" className="text-amber-400 underline">/admin</Link>.
          </li>
        </ol>
      </section>

      <section className="w-full max-w-2xl space-y-3">
        <h2 className="font-semibold text-center">Live metrics (production backend)</h2>
        {results ? (
          <div className="grid grid-cols-3 gap-4">
            <Kpi
              label="Routing accuracy"
              value={results.accuracy !== null ? `${(results.accuracy * 100).toFixed(0)}%` : "—"}
              sub={`${results.correct}/${results.totalEvaluated} labelled cases`}
            />
            <Kpi
              label="Avg latency"
              value={results.avgLatencyMs !== null ? `${(results.avgLatencyMs / 1000).toFixed(1)}s` : "—"}
              sub="full pipeline per match"
            />
            <Kpi
              label="Avg tokens"
              value={results.avgTokens !== null ? Math.round(results.avgTokens).toLocaleString() : "—"}
              sub="per match, all LLM calls"
            />
          </div>
        ) : (
          <p className="text-sm text-neutral-500 text-center">Loading live results…</p>
        )}
        <p className="text-xs text-neutral-500 text-center">
          Source: <Link href="/eval" className="underline hover:text-amber-400">/eval</Link> — labelled set run
          against the real Nebius pipeline (real API calls, no mocks).
        </p>
      </section>

      <section className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-2">
        <h2 className="font-semibold">Why this is not an LLM wrapper</h2>
        <p className="text-sm text-neutral-300">
          Retrieve-then-rerank: an embedding (Qwen3-Embedding-8B) narrows the pool to the top-3 by
          cosine similarity, then Llama-3.3-70B (Nebius Token Factory) makes the final call and can
          overrule similarity when the text shows the closest match is wrong. Model split is a
          deliberate cost/latency decision: the large model judges once, the cheap one scans everyone.
        </p>
      </section>

      <section className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-2">
        <h2 className="font-semibold">We broke it, then fixed it (verified)</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
          <li>
            Prompt injection (OWASP LLM01) hijacked matching outright — fixed with opaque labels,
            fenced untrusted text, and label validation.
          </li>
          <li>
            Keyword stuffing reached rank #2 on similarity — fixed with a breadth penalty in the
            shared scorer; attacker no longer reaches top-3.
          </li>
          <li>
            Hard negative demonstrated: retrieval wrong, reranker picks the legitimate volunteer
            from the lowest score and names the manipulation.
          </li>
        </ul>
      </section>

      <section className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-2">
        <h2 className="font-semibold">Honest limits</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
          <li>One-sided utility today — volunteer-side preference is not modelled.</li>
          <li>Linguistic-bias audit: no rank change in 5/5 pairs, but non-native scores 2–7 pts lower, consistently.</li>
          <li>Manual approval vets the volunteer, not the session — mitigated with a pre-session safety screen, not solved.</li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-neutral-500">
        <a
          href="https://github.com/rafaelcastro7/one-hour"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-400 underline underline-offset-2"
        >
          Code & write-up
        </a>
        <Link href="/eval" className="hover:text-amber-400 underline underline-offset-2">
          Full eval dashboard
        </Link>
        <Link href="/about" className="hover:text-amber-400 underline underline-offset-2">
          About
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
