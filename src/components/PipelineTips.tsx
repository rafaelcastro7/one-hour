"use client";

import { useEffect, useState } from "react";

// Rotating status messages for long waits (intake + matching pipeline).
// Like Claude's thinking feed: shows the user something is happening,
// with short sponsor/key-topic tips instead of a dead spinner.
const TIPS = [
  "Reading your message…",
  "Tip: matching runs on Nebius Token Factory (Llama-3.3-70B).",
  "Still working — embeddings compare meaning, not keywords…",
  "Tip: live state syncs via Convex, no refresh needed.",
  "Narrowing the volunteer pool…",
  "Tip: a second model reranks the top-3 and explains why.",
  "Almost there — preparing your result…",
  "Tip: video rooms are real Daily.co rooms on confirm.",
];

export function PipelineTips({ intervalMs = 4000 }: { intervalMs?: number }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TIPS.length), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" />
      </span>
      <span key={index} className="animate-pulse">
        {TIPS[index]}
      </span>
    </div>
  );
}
