"use client";

import { useEffect, useMemo, useState } from "react";

// Warm, fun thinking feed. ~50 tips across 5 families, picked by context
// (mode + progress + pipeline stage). Never repeats within a session, never
// mocks the user or the wait itself.

// --- FAMILY: sponsors, with a smile ---
const SPONSORS = [
  "Tip: matching runs on Nebius Token Factory — big models, tiny bill.",
  "Tip: Nebius does the heavy thinking twice per match. Worth it.",
  "Tip: live state syncs via Convex — no refresh button needed, ever.",
  "Tip: Convex reactivity is why this page updates by itself. Magic, but real.",
  "Tip: video rooms are real Daily.co rooms the moment both sides confirm.",
  "Tip: Daily.co spins your room up in seconds. Popcorn optional.",
  "Tip: this frontend rides on Render — sponsor-grade hosting.",
  "Tip: Linkup grounds Aria's answers in live web sources. No hallucinating alone.",
  "Tip: Qwen embeddings read meaning, not keywords. Fancy, right?",
  "Tip: Llama-3.3-70B makes the final call — the wise elder of this operation.",
];

// --- FAMILY: how the product works ---
const PRODUCT = [
  "Reading your message…",
  "Getting the full picture…",
  "Almost there — wrapping up…",
  "Comparing your need against active volunteers…",
  "Narrowing the pool to the top-3 candidates…",
  "A second model is picking the best match and saying why…",
  "Checking who is free when you are…",
  "Weighing skills, availability and good vibes…",
  "Tip: humans approve every volunteer before they can be matched.",
  "Tip: your summary is matched in English, whatever language you write in.",
  "Tip: the closest wording doesn't always win — the reranker knows.",
  "Tip: keyword-stuffed profiles get quietly demoted. Fair is fair.",
];

// --- FAMILY: trust & safety, warmly ---
const TRUST = [
  "Tip: volunteers are kind humans giving their time — not professionals.",
  "Tip: in crisis? findahelpline.com lists free lines by country.",
  "Tip: a good session starts with clear boundaries. We set them upfront.",
  "Tip: volunteers take a skills check — 2 of 3 to pass. No pressure, right?",
  "Tip: LinkedIn verifies every volunteer's identity. Real people only.",
  "Tip: sessions last one full hour. Good things take time.",
  "Tip: stepping back from an out-of-scope session is the right call, not a failure.",
  "Tip: your email is only used to reach you about your match. That's it.",
];

// --- FAMILY: impact & community ---
const IMPACT = [
  "One hour given is one hour earned. Time banking at its simplest.",
  "Small help, big day: most matches start with something embarrassingly simple.",
  "Volunteers keep 100% of the glory. We just do the matchmaking.",
  "Tech or languages today — low-risk categories while we learn.",
  "Someone, somewhere, debugged Postgres at midnight thanks to this.",
  "Your request helps the system learn what good matching looks like.",
  "Behind every match: a human who said 'I have an hour'.",
  "Multilingual by design — help in the language you dream in.",
];

// --- FAMILY: playful, never at the user's expense ---
const PLAYFUL = [
  "Consulting the volunteering spirits…",
  "Teaching embeddings to read between the lines…",
  "Polishing candidate profiles…",
  "Asking the LLM nicely to hurry up…",
  "Counting tokens so you don't have to…",
  "Herding volunteers (gently)…",
  "Warming up the video room…",
  "Double-checking nobody is a keyword-stuffing robot…",
  "Reticulating splines… just kidding. Matching humans.",
  "Good matches take ~30 seconds. Great ones too.",
];

const BY_MODE: Record<string, string[][]> = {
  need: [PRODUCT, TRUST, IMPACT, PLAYFUL, SPONSORS],
  offer: [PRODUCT, TRUST, IMPACT, PLAYFUL, SPONSORS],
  ai: [PRODUCT, SPONSORS, PLAYFUL, IMPACT],
  matching: [PRODUCT, SPONSORS, IMPACT, PLAYFUL],
};

const OFFER_EXTRA = [
  "Tip: you'll need 2 of 3 on the skills check to be eligible.",
  "Tip: your LinkedIn verifies your identity for matching.",
  "Tip: mark when you're free — matching respects your slots.",
];

type TipsContext = {
  mode?: "need" | "offer" | "ai" | "matching";
  messageCount?: number;
};

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PipelineTips({
  mode = "need",
  messageCount = 0,
  intervalMs = 4000,
}: TipsContext & { intervalMs?: number }) {
  // One shuffle per mount: contextual pool, no repeats within the session.
  const tips = useMemo(() => {
    const families = BY_MODE[mode] ?? BY_MODE.need;
    const progress =
      mode === "matching"
        ? []
        : messageCount <= 2
          ? ["Reading your message…"]
          : messageCount <= 5
            ? ["Getting the full picture…"]
            : ["Almost there — wrapping up…"];
    const extra = mode === "offer" ? OFFER_EXTRA : [];
    // Interleave families round-robin so categories mix instead of clumping.
    const pools = [...families.map((f) => [...f]), [...extra]];
    const mixed: string[] = [...progress];
    let added = true;
    while (added) {
      added = false;
      for (const pool of pools) {
        const next = pool.shift();
        if (next !== undefined && !mixed.includes(next)) {
          mixed.push(next);
          added = true;
        }
      }
    }
    return shuffled(mixed.slice(1)).length > 0
      ? [mixed[0], ...shuffled(mixed.slice(1))]
      : mixed;
  }, [mode, messageCount]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [mode, messageCount]);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % tips.length), intervalMs);
    return () => clearInterval(id);
  }, [tips.length, intervalMs]);

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
