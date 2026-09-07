"use node";

import OpenAI from "openai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Synthetic demo volunteers. These are NOT real people: no real names,
// emails, or profiles are used, and nobody is contacted. They exist so the
// matching pipeline (and especially the adversarial hard-negative case) can
// be exercised against a pool with genuine competition between candidates,
// instead of trivially picking the only row in the table.
//
// Emails use the reserved example.com domain (RFC 2606) precisely so they
// can never reach a real inbox.
const DEMO_VOLUNTEERS = [
  {
    name: "Demo — Backend/DB volunteer",
    email: "demo-backend@example.com",
    category: "tech" as const,
    profileSummary:
      "Backend engineer with 8 years of Node.js and Postgres experience, comfortable diagnosing production database issues including connection pooling exhaustion and query performance under load.",
    availability: "weekday evenings",
  },
  {
    name: "Demo — Frontend/React volunteer",
    email: "demo-frontend@example.com",
    category: "tech" as const,
    profileSummary:
      "Frontend developer specialising in React and Next.js, has debugged server-side rendering and hydration mismatch errors that only appear in production builds.",
    availability: "weekends",
  },
  {
    name: "Demo — Beginner programming tutor",
    email: "demo-tutor@example.com",
    category: "tech" as const,
    profileSummary:
      "Teaches programming fundamentals to complete beginners, patient with computer-science basics like recursion, loops and data structures, explains without jargon.",
    availability: "weekday afternoons",
  },
  {
    name: "Demo — DevOps/hosting volunteer",
    email: "demo-devops@example.com",
    category: "tech" as const,
    profileSummary:
      "Infrastructure and DevOps background, handles DNS configuration, hosting migrations and deployment outages, used to explaining infrastructure problems to non-technical people.",
    availability: "flexible",
  },
  {
    name: "Demo — Career/interview coach",
    email: "demo-career@example.com",
    category: "tech" as const,
    profileSummary:
      "Senior engineer who runs mock technical interviews and reviews resumes for backend and full-stack engineering roles, including behavioural interview practice.",
    availability: "weekday mornings",
  },
  {
    name: "Demo — Spanish conversation volunteer",
    email: "demo-spanish@example.com",
    category: "languages" as const,
    profileSummary:
      "Native Spanish speaker offering relaxed conversation practice for beginners, especially patient with people who feel nervous or self-conscious about speaking aloud.",
    availability: "weekday evenings",
  },
  {
    name: "Demo — French conversation volunteer",
    email: "demo-french-convo@example.com",
    category: "languages" as const,
    profileSummary:
      "Native French speaker offering casual French conversation practice and pronunciation help for learners at any level, friendly and informal sessions.",
    availability: "weekends",
  },
  {
    // The intended correct answer for the adversarial eval case. By wording,
    // the "French conversation" volunteer above looks closer to a request
    // phrased around French; this one is the right pick for reviewing
    // technical UI copy.
    name: "Demo — French technical translation reviewer",
    email: "demo-french-technical@example.com",
    category: "languages" as const,
    profileSummary:
      "Professional French translator who reviews software UI strings, button labels, error messages and technical documentation for naturalness and correct terminology. Not a conversation partner.",
    availability: "flexible",
  },
  {
    name: "Demo — French interview practice volunteer",
    email: "demo-french-interview@example.com",
    category: "languages" as const,
    profileSummary:
      "Fluent French speaker with corporate HR experience, helps candidates rehearse behavioural interview answers in French and gives feedback on professional register.",
    availability: "weekday evenings",
  },
  {
    name: "Demo — Mandarin everyday-conversation volunteer",
    email: "demo-mandarin@example.com",
    category: "languages" as const,
    profileSummary:
      "Mandarin speaker focused on practical everyday conversation for newcomers living in China: shopping, transport, doctor visits and small talk, rather than formal business Chinese.",
    availability: "flexible",
  },
];

// Seeded as pending, not approved: the admin queue is otherwise empty and
// the human approval gate -- a deliberate trust decision, not a missing
// feature -- has nothing to show.
const PENDING_VOLUNTEERS = [
  {
    name: "Demo — Awaiting review (Python/data)",
    email: "demo-pending-python@example.com",
    category: "tech" as const,
    profileSummary:
      "Data engineer offering help with Python, pandas and getting started with data analysis pipelines. Says they have five years of industry experience.",
    availability: "weekday evenings",
  },
  {
    name: "Demo — Awaiting review (German)",
    email: "demo-pending-german@example.com",
    category: "languages" as const,
    profileSummary:
      "Native German speaker offering conversation practice and help preparing for the Goethe-Institut B2 exam.",
    availability: "weekends",
  },
];

// AI helpers: clearly-labeled virtual volunteers for instant help when no
// human is around. They carry real embeddings and compete in the same pool,
// but the virtual penalty keeps them below any human candidate.
const VIRTUAL_VOLUNTEERS = [
  {
    name: "Aria (AI volunteer) — tech",
    email: "ai-tech@example.com",
    category: "tech" as const,
    profileSummary:
      "AI volunteer for instant tech help: debugging, programming concepts, databases and tooling questions. Answers immediately, no scheduling needed. Not a human — for hands-on or sensitive issues prefer a human volunteer.",
    availability: "instant, 24/7",
  },
  {
    name: "Aria (AI volunteer) — languages",
    email: "ai-languages@example.com",
    category: "languages" as const,
    profileSummary:
      "AI volunteer for instant language practice in English, Spanish, French or Mandarin: conversation, corrections and explanations. Answers immediately, no scheduling needed. Not a human — for real conversation prefer a human volunteer.",
    availability: "instant, 24/7",
  },
];

/**
 * Seeds the demo volunteer pool with pre-computed embeddings, already
 * approved and active, so the matching pipeline has real competition
 * between candidates to reason about.
 */
export const seed = internalAction({
  args: {},
  handler: async (ctx) => {
    // Must include pending volunteers too, or re-running the seed would
    // duplicate them (getAllActiveVolunteers only sees approved ones).
    const existing: Array<{ email: string }> = await ctx.runQuery(
      internal.volunteersQueries.getEveryVolunteer,
      {}
    );
    const existingEmails = new Set(existing.map((v) => v.email));

    const client = new OpenAI({
      baseURL: "https://api.tokenfactory.nebius.com/v1/",
      apiKey: process.env.NEBIUS_API_KEY,
    });

    let inserted = 0;
    for (const v of DEMO_VOLUNTEERS) {
      if (existingEmails.has(v.email)) continue;

      const res = await client.embeddings.create({
        model: "Qwen/Qwen3-Embedding-8B",
        input: v.profileSummary,
      });

      await ctx.runMutation(internal.volunteersMutations.insertSeedVolunteer, {
        name: v.name,
        email: v.email,
        category: v.category,
        rawOffer: v.profileSummary,
        profileSummary: v.profileSummary,
        availability: v.availability,
        embedding: res.data[0].embedding,
      });
      inserted++;
    }

    let pendingInserted = 0;
    let virtualInserted = 0;
    for (const v of VIRTUAL_VOLUNTEERS) {
      if (existingEmails.has(v.email)) continue;

      const res = await client.embeddings.create({
        model: "Qwen/Qwen3-Embedding-8B",
        input: v.profileSummary,
      });

      await ctx.runMutation(internal.volunteersMutations.insertSeedVolunteer, {
        name: v.name,
        email: v.email,
        category: v.category,
        rawOffer: v.profileSummary,
        profileSummary: v.profileSummary,
        availability: v.availability,
        embedding: res.data[0].embedding,
        isVirtual: true,
      });
      virtualInserted++;
    }
    for (const v of PENDING_VOLUNTEERS) {      if (existingEmails.has(v.email)) continue;

      const res = await client.embeddings.create({
        model: "Qwen/Qwen3-Embedding-8B",
        input: v.profileSummary,
      });

      await ctx.runMutation(internal.volunteersMutations.insertSeedVolunteer, {
        name: v.name,
        email: v.email,
        category: v.category,
        rawOffer: v.profileSummary,
        profileSummary: v.profileSummary,
        availability: v.availability,
        embedding: res.data[0].embedding,
        approved: false,
      });
      pendingInserted++;
    }

    return {
      inserted,
      pendingInserted,
      virtualInserted,
      skipped: DEMO_VOLUNTEERS.length - inserted,
    };
  },
});
