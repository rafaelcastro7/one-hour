import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How 1hour works: conversational intake, retrieve-then-rerank matching on Nebius, human approval gate, measured evaluation and honest limits.",
};

export default function AboutPage() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-10 bg-neutral-950 text-neutral-50">
      <div className="max-w-2xl w-full space-y-4 text-left">
        <h1 className="text-3xl font-bold tracking-tight text-center">About 1hour</h1>
        <p className="text-neutral-400 text-center">
          An AI-matched volunteering hub. One hour given, one hour you can claim —
          without the manual coordination bottleneck.
        </p>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">How matching works</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-300">
            <li>You describe what you need or offer, in conversation — not a form.</li>
            <li>The agent closes it into a structured profile (category, urgency, summary).</li>
            <li>That summary is embedded (Qwen3-Embedding-8B) and compared by cosine similarity.</li>
            <li>Top-3 candidates go to a second LLM call (Llama-3.3-70B) that picks and explains why.</li>
            <li>On confirm, a Daily.co video room is created live on both screens.</li>
          </ol>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">Measured, not claimed</h2>
          <p className="text-sm text-neutral-300">
            The live eval at <Link href="/eval" className="text-amber-400 underline">/eval</Link> runs
            a labelled set against the real pipeline: 10/10 routing, ~34s per match,
            ~490 tokens per match. A red-team harness found a working prompt injection
            and a keyword-stuffing attack — both fixed and regression-tested.
          </p>
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 space-y-3">
          <h2 className="font-semibold text-lg">Safety and limits</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300">
            <li>Every volunteer passes a human approval gate before activation.</li>
            <li>Request flow opens with a role boundary + crisis routing (findahelpline.com).</li>
            <li>Launch categories are tech and languages — low-risk by design.</li>
            <li>Matching optimizes one-sided utility today; reciprocal fairness and bias are audited openly.</li>
          </ul>
        </section>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Link
            href="/request"
            className="rounded-xl bg-amber-400 text-neutral-900 font-semibold px-6 py-3 text-center hover:bg-amber-300 transition-colors"
          >
            Try it — I need help
          </Link>
          <Link
            href="/offer"
            className="rounded-xl border-2 border-neutral-700 px-6 py-3 text-center font-semibold hover:border-amber-400 transition-colors"
          >
            Offer an hour
          </Link>
        </div>
      </div>
    </main>
  );
}
