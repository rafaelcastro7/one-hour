import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-neutral-800 bg-neutral-950">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4" aria-label="Main">
        <Link href="/" className="text-lg font-bold tracking-tight text-neutral-50">
          1hour
        </Link>
        <div className="flex items-center gap-5 text-sm text-neutral-400">
          <Link href="/about" className="hover:text-amber-400 transition-colors">
            About
          </Link>
          <Link href="/jury" className="hover:text-amber-400 transition-colors">
            Judges
          </Link>
          <Link href="/eval" className="hover:text-amber-400 transition-colors">
            Evidence
          </Link>
          <Link
            href="/request"
            className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-900 hover:bg-amber-300 transition-colors"
          >
            Get help
          </Link>
        </div>
      </nav>
    </header>
  );
}
