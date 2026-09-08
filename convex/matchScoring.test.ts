import { describe, expect, test } from "vitest";
import {
  avgRatingOf,
  cosineSimilarity,
  topicBreadth,
  penalisedScore,
  loadPenalty,
  keywordOverlapBonus,
  availabilityBonus,
  reputationBonus,
  scoreCandidate,
} from "./matchScoring";

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

describe("loadPenalty", () => {
  test("fresh volunteers carry no penalty", () => {
    expect(loadPenalty(0)).toBe(0);
  });

  test("grows with load but stays capped", () => {
    expect(loadPenalty(3)).toBeCloseTo(0.06);
    expect(loadPenalty(100)).toBeLessThanOrEqual(0.1);
  });
});

describe("keywordOverlapBonus", () => {
  test("rewards shared distinctive words", () => {
    const bonus = keywordOverlapBonus(
      "Postgres connection pooling exhaustion under load",
      "Backend engineer diagnosing Postgres connection pooling issues"
    );
    expect(bonus).toBeGreaterThan(0);
  });

  test("ignores stopwords and short words", () => {
    expect(keywordOverlapBonus("I want help please", "Happy to help you")).toBe(0);
  });

  test("is capped", () => {
    expect(
      keywordOverlapBonus(
        "postgres react dns python testing resume french spanish mandarin",
        "postgres react dns python testing resume french spanish mandarin expert"
      )
    ).toBeLessThanOrEqual(0.05);
  });
});

describe("scoreCandidate", () => {
  const emb = [1, 0];
  const profile = "Backend engineer, Postgres and databases.";

  test("a human outranks an identical virtual volunteer", () => {
    const human = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile });
    const virtual = scoreCandidate(emb, profile, {
      embedding: emb,
      profileSummary: profile,
      isVirtual: true,
    });
    expect(human).toBeGreaterThan(virtual);
  });

  test("a busy volunteer yields to a fresher equal one", () => {
    const fresh = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile });
    const busy = scoreCandidate(emb, profile, {
      embedding: emb,
      profileSummary: profile,
      matchCount: 5,
    });
    expect(fresh).toBeGreaterThan(busy);
  });

  test("matching availability breaks ties, ASAP constrains nothing", () => {
    const free = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile, slots: ["tue-evening"] }, ["tue-evening"]);
    const busy = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile, slots: ["wed-morning"] }, ["tue-evening"]);
    expect(free).toBeGreaterThan(busy);
    const asap = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile, slots: ["wed-morning"] }, []);
    expect(asap).toBeCloseTo(
      scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile, slots: ["wed-morning"] }),
      5
    );
  });
});

describe("availabilityBonus", () => {
  test("empty request slots mean no constraint", () => {
    expect(availabilityBonus([], ["tue-evening"])).toBe(0);
    expect(availabilityBonus(undefined, ["tue-evening"])).toBe(0);
  });

  test("volunteers without slots get no bonus", () => {
    expect(availabilityBonus(["tue-evening"], [])).toBe(0);
  });
});

describe("avgRatingOf", () => {
  test("no ratings means null (no bonus, no penalty)", () => {
    expect(avgRatingOf({})).toBeNull();
    expect(avgRatingOf({ ratingCount: 0, ratingSum: 5 })).toBeNull();
  });

  test("computes the mean", () => {
    expect(avgRatingOf({ ratingSum: 9, ratingCount: 2 })).toBeCloseTo(4.5);
  });

  test("a count without a sum degrades to 0, never NaN", () => {
    expect(avgRatingOf({ ratingCount: 2 })).toBe(0);
  });
});

describe("reputationBonus", () => {
  test("elite volunteers get the full lift", () => {
    expect(reputationBonus(4.8, 0)).toBeCloseTo(0.03);
    expect(reputationBonus(4.5, 0)).toBeCloseTo(0.03);
  });

  test("good-but-not-elite gets the small lift", () => {
    expect(reputationBonus(4.2, 0)).toBeCloseTo(0.01);
  });

  test("below 4.0 gets nothing", () => {
    expect(reputationBonus(3.9, 0)).toBe(0);
    expect(reputationBonus(null, 0)).toBe(0);
  });

  test("no-shows demote, and stack against ratings", () => {
    expect(reputationBonus(null, 1)).toBeCloseTo(-0.02);
    expect(reputationBonus(null, 2)).toBeCloseTo(-0.05);
    expect(reputationBonus(null, 9)).toBeCloseTo(-0.05);
    expect(reputationBonus(5, 2)).toBeCloseTo(-0.02);
  });
});

describe("scoreCandidate reputation wiring", () => {  const emb = [1, 0];
  const profile = "Backend engineer, Postgres and databases.";

  test("a proven volunteer outranks an unrated twin", () => {
    const plain = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile });
    const proven = scoreCandidate(emb, profile, {
      embedding: emb,
      profileSummary: profile,
      ratingSum: 15,
      ratingCount: 3,
    });
    expect(proven).toBeGreaterThan(plain);
  });

  test("a serial no-show sinks below an unrated twin", () => {
    const plain = scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile });
    const flaky = scoreCandidate(emb, profile, {
      embedding: emb,
      profileSummary: profile,
      noShowCount: 3,
    });
    expect(plain).toBeGreaterThan(flaky);
  });
});

describe("cosineSimilarity guards", () => {
  test("mismatched dimensions score 0 instead of NaN", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  test("empty vectors score 0", () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });
});

describe("requested-again bonus", () => {
  const emb = [1, 0];
  const profile = "Backend engineer, Postgres and databases.";

  test("the asked-for volunteer wins over an equal stranger", () => {
    const stranger = scoreCandidate(emb, profile, { id: "a", embedding: emb, profileSummary: profile });
    const asked = scoreCandidate(emb, profile, { id: "b", embedding: emb, profileSummary: profile }, undefined, "b");
    expect(asked).toBeGreaterThan(stranger);
  });

  test("no bonus without a preference, or for someone else", () => {
    const base = scoreCandidate(emb, profile, { id: "a", embedding: emb, profileSummary: profile });
    expect(
      scoreCandidate(emb, profile, { id: "a", embedding: emb, profileSummary: profile }, undefined, "b")
    ).toBeCloseTo(base, 5);
    expect(
      scoreCandidate(emb, profile, { embedding: emb, profileSummary: profile }, undefined, "b")
    ).toBeCloseTo(base, 5);
  });
});
