"use client";

import { useEffect, useState } from "react";

// Contextual thinking feed: tips adapt to the conversation (mode, progress,
// pipeline stage) instead of rotating generic lines. Like Claude's feed while
// it works -- the user sees the wait is about THEIR request, not a spinner.

type TipsContext = {
  mode?: "need" | "offer" | "ai" | "matching";
  messageCount?: number;
};

const SPONSOR_TIPS = [
  "Tip: matching runs on Nebius Token Factory (Llama-3.3-70B).",
  "Tip: live state syncs via Convex — no refresh needed.",
  "Tip: video rooms are real Daily.co rooms on confirm.",
];

const NEED_TIPS = [
  "Comparing your need against active volunteers…",
  "Tip: every volunteer passed a human approval gate first.",
  "Narrowing to the top-3 candidates…",
];

const OFFER_TIPS = [
  "Reading what you can offer…",
  "Tip: you'll need 2 of 3 on the skills check to be eligible.",
  "Tip: your LinkedIn verifies your identity for matching.",
];

const AI_TIPS = [
  "Aria is checking live sources…",
  "Tip: answers cite real pages, not just model memory.",
];

const MATCHING_TIPS = [
  "Reading your conversation…",
  "Comparing against every active volunteer…",
  "A second model is picking the best match and saying why…",
];

function pickPool(ctx: TipsContext): string[] {
  switch (ctx.mode) {
    case "offer":
      return OFFER_TIPS;
    case "ai":
      return AI_TIPS;
    case "matching":
      return MATCHING_TIPS;
    default:
      return NEED_TIPS;
  }
}

function progressLine(count: number): string | null {
  if (count <= 2) return "Reading your message…";
  if (count <= 5) return "Getting the full picture…";
  return "Almost there — wrapping up…";
}

export function PipelineTips({ mode = "need", messageCount = 0, intervalMs = 4000 }: TipsContext & { intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const pool = pickPool({ mode });
  const progress = mode === "matching" ? null : progressLine(messageCount);
  const tips = progress ? [progress, ...pool, ...SPONSOR_TIPS] : [...pool, ...SPONSOR_TIPS];

  useEffect(() => {
    setIndex(0);
    const id = setInterval(() => setIndex((i) => (i + 1) % tips.length), intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, messageCount, intervalMs]);

  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400" role="status" aria-live="polite">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce" />
      </span>
      <span key={`${mode}-${messageCount}-${index}`} className="animate-pulse">
        {tips[index % tips.length]}
      </span>
    </div>
  );
}
