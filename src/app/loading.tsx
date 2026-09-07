export default function Loading() {
  return (
    <main className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-50">
      <div className="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-amber-400 animate-spin" role="status" aria-label="Loading" />
    </main>
  );
}
