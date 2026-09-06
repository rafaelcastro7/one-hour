import { describe, expect, test } from "vitest";
import { cosineSimilarity, topicBreadth, penalisedScore } from "./matchScoring";

// These guard the retrieval defence that a red-team probe showed was needed:
// a keyword-stuffed profile reached rank #2 on raw cosine similarity before
// the breadth penalty existed. The penalty is pure, deterministic logic, so
// it's worth locking down against silent regression -- unlike the Nebius
// calls, it can be tested without any network.

describe("cosineSimilarity", () => {
  test("identical vectors score 1", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
  });

  test("orthogonal vectors score 0", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  test("opposite vectors score -1", () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
  });

  test("a zero vector never divides by zero", () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe("topicBreadth", () => {
  test("a focused profile touches one or two areas", () => {
    const backend =
      "Backend engineer with Postgres and connection pooling experience.";
    expect(topicBreadth(backend)).toBeLessThanOrEqual(2);
  });

  test("a keyword-stuffed profile touches many areas", () => {
    const stuffed =
      "Postgres React Next.js DNS hosting Python recursion testing resume interview French Spanish Mandarin translation UI copy conversation practice";
    expect(topicBreadth(stuffed)).toBeGreaterThanOrEqual(6);
  });
});

describe("penalisedScore", () => {
  const focusedProfile = "Backend engineer, Postgres and databases.";
  const stuffedProfile =
    "Postgres React DNS Python testing resume French Spanish Mandarin translation UI copy conversation";

  test("leaves a focused profile's score essentially untouched", () => {
    const raw = 0.6;
    expect(penalisedScore(raw, focusedProfile)).toBeCloseTo(raw);
  });

  test("demotes a broad profile below its raw score", () => {
    const raw = 0.6;
    expect(penalisedScore(raw, stuffedProfile)).toBeLessThan(raw);
  });

  test("the penalty is capped, never flipping a strong match to negative", () => {
    const raw = 0.2;
    // Even a maximally broad profile can lose at most the capped penalty.
    expect(penalisedScore(raw, stuffedProfile)).toBeGreaterThan(raw - 0.3);
  });

  test("a genuinely better focused match still beats a stuffed one", () => {
    // The attack that motivated this: stuffed profile with high raw
    // similarity vs. a focused profile with slightly lower raw similarity.
    const focused = penalisedScore(0.62, focusedProfile);
    const stuffed = penalisedScore(0.66, stuffedProfile);
    expect(focused).toBeGreaterThan(stuffed);
  });
});
