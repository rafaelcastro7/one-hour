"use node";

// Shared retrieval scoring. Production matching, the eval runner and the
// red-team harness all import from here so they can't drift apart and
// quietly test something the real pipeline no longer does.

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Distinct topic areas a profile can claim. A genuine volunteer clusters in
// one or two of these; a profile stuffed with keywords to rank for every
// query touches many at once.
const TOPIC_MARKERS: Array<RegExp> = [
  /\b(postgres|sql|database|query|pooling)\b/i,
  /\b(react|next\.?js|frontend|hydration|css|html)\b/i,
  /\b(dns|hosting|deploy(ment)?|devops|infrastructure|server)\b/i,
  /\b(python|recursion|algorithm|data structure)\b/i,
  /\b(test(ing|s)?|pytest|jest|test suite)\b/i,
  /\b(resume|cv|interview|hiring|career)\b/i,
  /\b(french|français)\b/i,
  /\b(spanish|español|castellano)\b/i,
  /\b(mandarin|chinese|中文)\b/i,
  /\b(translation|localis|localiz|ui copy|terminology)\b/i,
];

/**
 * Counts how many unrelated topic areas a profile claims.
 *
 * This is the signal behind the breadth penalty: a shilling / profile
 * injection attack (arXiv:2402.09023) works by writing a profile that
 * enumerates every skill, so it sits near the centroid of many different
 * queries at once and reaches the top-K for all of them.
 */
export function topicBreadth(text: string): number {
  return TOPIC_MARKERS.filter((re) => re.test(text)).length;
}

// Profiles legitimately span a couple of areas ("backend and databases").
// Beyond this, breadth stops looking like range and starts looking like
// keyword stuffing.
const BREADTH_FREE_ALLOWANCE = 3;
const BREADTH_PENALTY_PER_TOPIC = 0.04;
const MAX_BREADTH_PENALTY = 0.25;

/**
 * Similarity with a penalty for implausibly broad profiles.
 *
 * Deliberately a soft penalty, not a filter: a real polymath volunteer is
 * demoted a little, never excluded, and the LLM reranker still gets to see
 * them. It costs a genuine generalist a few ranking positions; it costs a
 * keyword-stuffed profile its free ride into the top-K.
 */
export function penalisedScore(rawScore: number, profileText: string): number {
  const breadth = topicBreadth(profileText);
  const excess = Math.max(0, breadth - BREADTH_FREE_ALLOWANCE);
  const penalty = Math.min(excess * BREADTH_PENALTY_PER_TOPIC, MAX_BREADTH_PENALTY);
  return rawScore - penalty;
}
