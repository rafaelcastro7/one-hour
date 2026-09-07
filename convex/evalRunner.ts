"use node";

import OpenAI from "openai";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { scoreCandidate } from "./matchScoring";

// Mirrors convex/nebius.ts's client setup exactly, but kept separate so the
// eval runner can measure latency/tokens without touching the production
// matching pipeline that's already verified end-to-end.
function getClient() {
  return new OpenAI({
    baseURL: "https://api.tokenfactory.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY,
  });
}

const CHAT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
const EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-8B";


/**
 * Runs every seeded eval case against the LIVE Nebius pipeline (not a
 * mock): closes a synthetic profile for the need text, embeds it, compares
 * against all active volunteers by cosine similarity, and separately asks
 * the LLM decision layer to pick the best match. Records latency, token
 * usage, and -- for the adversarial case -- both the pure-cosine pick and
 * the LLM's pick side by side, so the eval dashboard can show the exact
 * failure mode the decision layer exists to catch.
 */
// Fans the cases out as independent scheduled actions rather than looping
// here. Nebius calls take ~20s each and every case needs up to three of
// them, so a sequential run over ten cases would blow past the action
// timeout long before finishing.
export const runAll = internalAction({
  args: {},
  handler: async (ctx) => {
    const cases: Array<{ _id: string }> = await ctx.runQuery(
      internal.evaluation.listCasesInternal,
      {}
    );

    for (const c of cases) {
      await ctx.scheduler.runAfter(0, internal.evalRunner.runOne, {
        evalCaseId: c._id as any,
      });
    }

    return { scheduled: cases.length };
  },
});

export const runOne = internalAction({
  args: { evalCaseId: v.id("evalCases") },
  handler: async (ctx, { evalCaseId }) => {
    const client = getClient();

    const allCases: Array<{
      _id: string;
      needText: string;
      expectedCategory: string;
    }> = await ctx.runQuery(internal.evaluation.listCasesInternal, {});
    const c = allCases.find((x) => x._id === evalCaseId);
    if (!c) return;

    const volunteers: Array<{
      _id: string;
      category: string;
      profileSummary: string;
      embedding: number[];
    }> = await ctx.runQuery(internal.volunteersQueries.getAllActiveVolunteers, {});

    {
      const start = Date.now();
      let estimatedTokens = 0;

      const closeCompletion = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          {
            role: "system",
            content:
              `Analyze this need and return JSON with: category ("tech" or "languages"), ` +
              `summary (one-sentence, in English, specific detail for semantic matching).`,
          },
          { role: "user", content: c.needText },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });
      estimatedTokens += closeCompletion.usage?.total_tokens ?? 0;
      const profile = JSON.parse(closeCompletion.choices[0].message.content ?? "{}");

      const embedRes = await client.embeddings.create({
        model: EMBEDDING_MODEL,
        input: profile.summary ?? c.needText,
      });
      estimatedTokens += embedRes.usage?.total_tokens ?? 0;
      const embedding = embedRes.data[0].embedding;

      const needSummary = profile.summary ?? c.needText;
      const candidates = volunteers
        .filter((v) => v.category === (profile.category ?? c.expectedCategory))
        .map((v) => ({
          id: v._id,
          summary: v.profileSummary,
          score: scoreCandidate(embedding, needSummary, v),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const topCandidateByCosineOnly = candidates[0]?.summary ?? "(no active volunteers)";

      let chosenByLLM = "(no candidates)";
      let llmReasoning = "No volunteers available for this category.";

      if (candidates.length > 0) {
        const candidateList = candidates
          .map((cd, i) => `${i + 1}. [id=${cd.id}] ${cd.summary} (similarity: ${cd.score.toFixed(3)})`)
          .join("\n");

        const decisionCompletion = await client.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            {
              role: "system",
              content:
                `You are the final decision engine of a volunteering matcher. Pick the BEST ` +
                `real match from the pre-filtered candidates (not necessarily the highest ` +
                `numeric score). Respond in JSON: {"chosenId": "<id or null>", "reasoning": "<brief>"}.`,
            },
            {
              role: "user",
              content: `Need: ${profile.summary ?? c.needText}\n\nCandidates:\n${candidateList}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        estimatedTokens += decisionCompletion.usage?.total_tokens ?? 0;
        const decision = JSON.parse(decisionCompletion.choices[0].message.content ?? "{}");
        const chosen = candidates.find((cd) => cd.id === decision.chosenId);
        chosenByLLM = chosen?.summary ?? "(LLM found no suitable match)";
        llmReasoning = decision.reasoning ?? "";
      }

      const latencyMs = Date.now() - start;
      const wasCorrect = profile.category === c.expectedCategory;

      await ctx.runMutation(internal.evaluation.recordRunResult, {
        evalCaseId: c._id as any,
        actualMatchDescription: chosenByLLM,
        wasCorrect,
        topCandidateByCosineOnly,
        chosenByLLM,
        llmReasoning,
        latencyMs,
        estimatedTokens,
      });
    }
  },
});
