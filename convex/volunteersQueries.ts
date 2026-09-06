import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getActiveVolunteers = internalQuery({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query("volunteers")
      .withIndex("by_category", (q) => q.eq("category", category as any))
      .filter((q) => q.eq(q.field("active"), true))
      .collect();
  },
});

// Used by convex/evalRunner.ts, which needs the whole active pool up front
// since each eval case can resolve to either category.
export const getAllActiveVolunteers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("volunteers")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
  },
});
