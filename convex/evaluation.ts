import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Casos de evaluación pre-cargados para medir precisión del matching --
// requisito explícito del track Applied AI de Nebius: "measure at least
// one of: accuracy, time to complete the task, or cost per task."
export const addEvalCase = mutation({
  args: {
    needText: v.string(),
    expectedCategory: v.string(),
    expectedMatchDescription: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("evalCases", args);
  },
});

export const recordResult = mutation({
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

export const listResults = query({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db.query("evalCases").collect();
    const evaluated = cases.filter((c) => c.wasCorrect !== undefined);
    const correct = evaluated.filter((c) => c.wasCorrect).length;
    return {
      cases,
      totalEvaluated: evaluated.length,
      correct,
      accuracy: evaluated.length > 0 ? correct / evaluated.length : null,
    };
  },
});
