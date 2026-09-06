import { internalMutation } from "./_generated/server";

// Ten representative evaluation cases across both launch categories,
// used to measure matching accuracy (the Nebius Applied AI track requires
// showing at least one measured dimension: accuracy, latency, or cost).
const CASES = [
  {
    needText:
      "I'm a first-time founder and my Next.js app throws a hydration error only in production, never locally. I've spent two days on it.",
    expectedCategory: "tech",
    expectedMatchDescription:
      "A volunteer with frontend/React/Next.js debugging experience, ideally who has hit hydration mismatches before.",
  },
  {
    needText:
      "I need someone to review my resume and do a mock interview for a backend engineering role before Friday.",
    expectedCategory: "tech",
    expectedMatchDescription:
      "A volunteer with backend engineering experience willing to do interview practice/resume review, available before the deadline.",
  },
  {
    needText:
      "My startup's Postgres database keeps running out of connections under load and I don't know how to diagnose it.",
    expectedCategory: "tech",
    expectedMatchDescription:
      "A volunteer with database/backend infrastructure experience, specifically connection pooling or Postgres operations.",
  },
  {
    needText:
      "I want to practice conversational Spanish for 30 minutes a week, I'm at a beginner level and get nervous speaking.",
    expectedCategory: "languages",
    expectedMatchDescription:
      "A patient native or fluent Spanish speaker comfortable with beginners, available for short recurring sessions.",
  },
  {
    needText:
      "I have a job interview in French next week and need to practice answering behavioral questions out loud.",
    expectedCategory: "languages",
    expectedMatchDescription:
      "A fluent French speaker, ideally with interview or professional coaching experience, available before next week.",
  },
  {
    needText:
      "I moved to a Mandarin-speaking country for work and need help with everyday conversational phrases, not business Chinese.",
    expectedCategory: "languages",
    expectedMatchDescription:
      "A Mandarin speaker focused on everyday/survival conversation rather than formal or business Chinese.",
  },
  {
    needText:
      "I'm learning to code and stuck on a Python recursion assignment for my university course, need it explained simply.",
    expectedCategory: "tech",
    expectedMatchDescription:
      "A volunteer comfortable teaching programming fundamentals to beginners, patient with recursion/CS-101 concepts.",
  },
  {
    needText:
      "I need someone to pair with me on writing my first automated test suite for a small Express API.",
    expectedCategory: "tech",
    expectedMatchDescription:
      "A volunteer with testing/Node.js experience willing to pair-program on writing an initial test suite.",
  },
  {
    // Adversarial case: wording overlaps heavily with a generic "language
    // teacher" profile by embedding similarity, but the actual need is a
    // technical translation review, not conversation practice -- this is
    // the kind of case the LLM decision layer over the top-K candidates
    // is meant to catch, and the pure-cosine baseline is expected to miss.
    needText:
      "I translated my app's UI strings into French myself as a non-native speaker and need a fluent speaker to review the technical wording (buttons, error messages) for naturalness, not a conversation partner.",
    expectedCategory: "languages",
    expectedMatchDescription:
      "A fluent French speaker specifically comfortable reviewing short technical/UI copy, not a general conversation-practice volunteer -- documents a case where highest cosine similarity (matches a 'French conversation practice' volunteer) is the wrong pick.",
  },
  {
    needText:
      "My small nonprofit's website is down and I think it's a DNS or hosting config issue, I have zero technical background.",
    expectedCategory: "tech",
    expectedMatchDescription:
      "A volunteer comfortable with DNS/hosting/deployment issues, able to explain things to a non-technical person.",
  },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("evalCases").collect();
    if (existing.length > 0) {
      return { inserted: 0, skipped: existing.length, reason: "evalCases already seeded" };
    }
    for (const c of CASES) {
      await ctx.db.insert("evalCases", c);
    }
    return { inserted: CASES.length, skipped: 0 };
  },
});
