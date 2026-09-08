import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Casos de evaluación pre-cargados para medir precisión del matching --
// requisito explícito del track Applied AI de Nebius: "measure at least
// one of: accuracy, time to complete the task, or cost per task."
// Internal-only: these mutate the jury's labelled set, so no public client
// may insert or rewrite cases. Seeding goes through seedEvalCases.
export const addEvalCase = internalMutation({
  args: {
    needText: v.string(),
    expectedCategory: v.string(),
    expectedMatchDescription: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("evalCases", args);
  },
});

export const recordResult = internalMutation({
  args: {
    evalCaseId: v.id("evalCases"),
    actualMatchDescription: v.string(),
    wasCorrect: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { evalCaseId, ...rest }) => {
    await ctx.db.patch(evalCaseId, rest);
  },
});

// Kicks off convex/evalRunner.ts:runAll in the background -- lets the /eval
// dashboard trigger a live run (real Nebius calls, real latency/cost) with
// one click, instead of only showing whatever was last seeded.
export const runEvaluation = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.evalRunner.runAll, {});
  },
});

export const listResults = query({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("evalCases").collect();
    const evaluated = cases.filter((c) => c.wasCorrect !== undefined);
    const correct = evaluated.filter((c) => c.wasCorrect).length;
    const withLatency = cases.filter((c) => c.latencyMs !== undefined);
    const withTokens = cases.filter((c) => c.estimatedTokens !== undefined);
    const avgLatencyMs =
      withLatency.length > 0
        ? withLatency.reduce((sum, c) => sum + (c.latencyMs ?? 0), 0) / withLatency.length
        : null;
    const avgTokens =
      withTokens.length > 0
        ? withTokens.reduce((sum, c) => sum + (c.estimatedTokens ?? 0), 0) / withTokens.length
        : null;
    return {
      cases,
      totalEvaluated: evaluated.length,
      correct,
      accuracy: evaluated.length > 0 ? correct / evaluated.length : null,
      avgLatencyMs,
      avgTokens,
    };
  },
});

// Internal helpers used by convex/evalRunner.ts (which runs "use node" and
// can't touch the database directly) to run all seeded cases against the
// live Nebius pipeline and record accuracy/latency/token-cost results.
export const listCasesInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("evalCases").collect();
  },
});

export const recordRunResult = internalMutation({
  args: {
    evalCaseId: v.id("evalCases"),
    actualMatchDescription: v.string(),
    wasCorrect: v.boolean(),
    topCandidateByCosineOnly: v.string(),
    chosenByLLM: v.string(),
    llmReasoning: v.string(),
    latencyMs: v.number(),
    estimatedTokens: v.number(),
  },
  handler: async (ctx, { evalCaseId, ...rest }) => {
    await ctx.db.patch(evalCaseId, { ...rest, lastRunAt: Date.now() });
  },
});
