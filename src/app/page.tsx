import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center px-6 py-16 gap-14 text-center bg-neutral-950 text-neutral-50">
      <section className="max-w-xl space-y-4">
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
          Burning Token · Applied AI
        </p>
        <h1 className="text-4xl font-bold tracking-tight">1hour</h1>
        <p className="text-neutral-400 text-lg">
          Give an hour of your time, or get an hour of help. Talk to our agent —
          no forms — and we find you the right match.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto pt-2">
          <Link
            href="/request"
            className="flex-1 rounded-xl bg-amber-400 text-neutral-900 font-semibold px-6 py-4 text-lg hover:bg-amber-300 transition-colors"
          >
            I need help
          </Link>
          <Link
            href="/offer"
            className="flex-1 rounded-xl border-2 border-neutral-700 text-neutral-100 font-semibold px-6 py-4 text-lg hover:border-amber-400 transition-colors"
          >
            I want to help
          </Link>
        </div>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Tech and languages to start. Matching by an AI agent (Nebius Token Factory),
          not rigid forms. Measured: 10/10 routing, ~34s per match, ~490 tokens.
        </p>
      </section>

      <section className="w-full max-w-3xl grid sm:grid-cols-3 gap-4 text-left" aria-label="How it works">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <p className="font-semibold">1. Talk, don&apos;t fill forms</p>
          <p className="text-sm text-neutral-400">
            A short conversation turns what you said into a structured profile.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <p className="font-semibold">2. Semantic match + LLM rerank</p>
          <p className="text-sm text-neutral-400">
            Embeddings narrow to top-3, a second model picks and explains why.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-2">
          <p className="font-semibold">3. Real video on confirm</p>
          <p className="text-sm text-neutral-400">
            Both sides confirm, a Daily.co room appears live. Humans approve volunteers first.
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-neutral-500" aria-label="Evidence">
        <Link href="/eval" className="hover:text-amber-400 underline underline-offset-2">
          Accuracy, latency & cost
        </Link>
        <Link href="/about" className="hover:text-amber-400 underline underline-offset-2">
          How it works
        </Link>
        <Link href="/admin" className="hover:text-amber-400 underline underline-offset-2">
          Volunteer approval
        </Link>
      </section>
    </main>
  );
}
