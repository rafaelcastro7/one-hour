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
