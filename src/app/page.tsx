import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-10 text-center bg-neutral-950 text-neutral-50">
      <div className="max-w-xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">One Hour</h1>
        <p className="text-neutral-400 text-lg">
          Connect with someone who can give you an hour of their time, or give
          an hour of yours. Talk to our agent, no forms, and we find you the
          right match.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
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

      <p className="text-xs text-neutral-600 max-w-md">
        Categories available now: tech and languages. Matching is done by an
        AI agent (Nebius Token Factory) based on what you tell us, not rigid
        forms.
      </p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-neutral-500">
        <Link href="/eval" className="hover:text-amber-400 underline underline-offset-2">
          Accuracy, latency & cost
        </Link>
        <Link href="/admin" className="hover:text-amber-400 underline underline-offset-2">
          Volunteer approval
        </Link>
        <a
          href="https://github.com/rafaelcastro7/one-hour"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-400 underline underline-offset-2"
        >
          How it works (code & write-up)
        </a>
      </div>
    </main>
  );
}
