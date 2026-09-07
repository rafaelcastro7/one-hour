"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16 bg-neutral-950 text-neutral-50 text-center">
      <p className="text-lg font-semibold">Something went wrong.</p>
      <p className="text-sm text-neutral-400 max-w-sm">
        The page hit an unexpected error. Your data is safe — try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
      >
        Try again
      </button>
    </main>
  );
}
