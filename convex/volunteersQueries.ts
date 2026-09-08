import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getActiveVolunteers = internalQuery({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    // Matching pool: verified AND active AND embedded. Pending volunteers,
    // deactivated ones, and rows whose intake failed (empty embedding) must
    // never reach a real user. Length checks run in memory: array comparison
    // inside a filter expression is not a reliable emptiness test.
    const rows = await ctx.db
      .query("volunteers")
      .withIndex("by_category", (q) => q.eq("category", category as any))
      .collect();
    return rows.filter((v) => v.active && v.verified && v.embedding.length > 0);
  },
});

// Every volunteer regardless of approval state. Used by seeding to avoid
// duplicating rows that exist but are still awaiting review.
export const getEveryVolunteer = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("volunteers").collect();
  },
});

// Red-team pool for convex/adversarialTests.ts probe: active + embedded but
// WITHOUT the verified gate, so seeded attackers (deliberately unapproved)
// are visible to the harness while staying invisible to real user matching.
export const getProbePool = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("volunteers")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return rows.filter((v) => v.active && v.embedding.length > 0);
  },
});

// Used by convex/evalRunner.ts, which needs the whole active pool up front
// since each eval case can resolve to either category. Same membership rule
// as the production pool: verified, active, embedded.
export const getAllActiveVolunteers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("volunteers")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    return rows.filter((v) => v.active && v.verified && v.embedding.length > 0);
  },
});
