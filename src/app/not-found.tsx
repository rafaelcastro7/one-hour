import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center gap-4 px-6 py-16 bg-neutral-950 text-neutral-50 text-center">
      <p className="text-lg font-semibold">Page not found.</p>
      <p className="text-sm text-neutral-400">The page you opened doesn&apos;t exist.</p>
      <Link href="/" className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3">
        Back to 1hour
      </Link>
    </main>
  );
}
