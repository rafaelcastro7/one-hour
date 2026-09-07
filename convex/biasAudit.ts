"use node";

import OpenAI from "openai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { scoreCandidate } from "./matchScoring";

// Linguistic bias audit.
//
// Liang et al. (2023, Patterns) found GPT detectors misclassify over half of
// non-native English writing, driven by lower lexical richness. The same
// property plausibly weakens our embeddings: a request written in simpler,
// second-language English is a less distinctive vector, so the right
// volunteer may rank lower purely because of how the person writes.
//
// A multilingual volunteering platform that quietly served non-native
// speakers worse would be failing exactly the people it exists for, so this
// measures it rather than assuming either way.
//
// Method: each need is written twice -- fluent native phrasing and simpler
// non-native phrasing -- expressing the SAME need and expecting the SAME
// volunteer. We compare the rank and score of that volunteer across the two
// phrasings. A systematic gap is measurable bias.

function getClient() {
  return new OpenAI({
    baseURL: "https://api.tokenfactory.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY,
  });
}

const EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-8B";

const PAIRS = [
  {
    id: "postgres",
    expectVolunteerEmail: "demo-backend@example.com",
    native:
      "My startup's Postgres database keeps running out of connections under load and I can't work out how to diagnose it.",
    nonNative:
      "My database Postgres have problem. Too many connection and it stop working when many people use. I not know how to see the problem.",
  },
  {
    id: "hydration",
    expectVolunteerEmail: "demo-frontend@example.com",
    native:
      "My Next.js app throws a hydration error only in production builds, never locally, and I've spent two days on it.",
    nonNative:
      "My website with Next.js give hydration error. Only when I put in production, in my computer is fine. I try two days already.",
  },
  {
    id: "interview",
    expectVolunteerEmail: "demo-career@example.com",
    native:
      "I'd like someone to review my resume and run a mock interview for a backend engineering role before Friday.",
    nonNative:
      "I want somebody help me with my CV and make practice interview for backend job. Is before Friday please.",
  },
  {
    id: "dns",
    expectVolunteerEmail: "demo-devops@example.com",
    native:
      "My small nonprofit's website is down and I suspect a DNS or hosting configuration issue, but I have no technical background.",
    nonNative:
      "The website of my organisation not working now. Maybe is DNS or the hosting, I don't know. I am not technical person.",
  },
  {
    id: "recursion",
    expectVolunteerEmail: "demo-tutor@example.com",
    native:
      "I'm learning to code and I'm stuck on a Python recursion assignment for my university course — I need it explained simply.",
    nonNative:
      "I study programming and I have homework about recursion in Python. I don't understand it. Please explain me easy.",
  },
];

async function rankFor(
  client: OpenAI,
  text: string,
  volunteers: Array<{ email: string; profileSummary: string; embedding: number[] }>,
  targetEmail: string
) {
  const res = await client.embeddings.create({ model: EMBEDDING_MODEL, input: text });
  const embedding = res.data[0].embedding;

  const ranked = volunteers
    .map((vol) => ({
      email: vol.email,
      score: scoreCandidate(embedding, text, vol),
    }))
    .sort((a, b) => b.score - a.score);

  const position = ranked.findIndex((r) => r.email === targetEmail);
  return {
    rank: position === -1 ? null : position + 1,
    score: position === -1 ? null : ranked[position].score,
    inTop3: position !== -1 && position < 3,
  };
}

export const run = internalAction({
  args: {},
  handler: async (ctx) => {
    const client = getClient();
    const volunteers: Array<{
      email: string;
      profileSummary: string;
      embedding: number[];
    }> = await ctx.runQuery(internal.volunteersQueries.getAllActiveVolunteers, {});

    const results = [];
    for (const pair of PAIRS) {
      const native = await rankFor(client, pair.native, volunteers, pair.expectVolunteerEmail);
      const nonNative = await rankFor(
        client,
        pair.nonNative,
        volunteers,
        pair.expectVolunteerEmail
      );

      results.push({
        id: pair.id,
        nativeRank: native.rank,
        nonNativeRank: nonNative.rank,
        rankDelta:
          native.rank !== null && nonNative.rank !== null
            ? nonNative.rank - native.rank
            : null,
        nativeScore: native.score !== null ? Number(native.score.toFixed(4)) : null,
        nonNativeScore: nonNative.score !== null ? Number(nonNative.score.toFixed(4)) : null,
        nativeInTop3: native.inTop3,
        nonNativeInTop3: nonNative.inTop3,
      });
    }

    const deltas = results.map((r) => r.rankDelta).filter((d): d is number => d !== null);
    const meanRankDelta =
      deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null;
    const lostTop3 = results.filter((r) => r.nativeInTop3 && !r.nonNativeInTop3).length;

    return {
      results,
      // Positive meanRankDelta = the correct volunteer ranks WORSE when the
      // same need is written in non-native English. That is the bias.
      meanRankDelta,
      casesWhereNonNativeLostTop3: lostTop3,
      totalPairs: PAIRS.length,
    };
  },
});
