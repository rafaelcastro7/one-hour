import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

// Time-credit ledger helpers. All movements happen inside the request
// lifecycle only: welcome grant on first request, charge on create, earn on
// complete. Keyed by lowercase email (no auth in v1).

// Public balance lookup so the status page can show "your hours".
export const balanceOf = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const row = await ctx.db
      .query("balances")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    return row?.balance ?? 0;
  },
});

// Capability-scoped balance lookup for a request status page. This avoids
// sending the requester's email to the browser just to render their balance.
export const balanceForRequest = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);
    if (!request) return null;
    const row = await ctx.db
      .query("balances")
      .withIndex("by_email", (q) => q.eq("email", request.email.toLowerCase()))
      .unique();
    return row?.balance ?? 0;
  },
});

export const getBalance = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const row = await ctx.db
      .query("balances")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    return row?.balance ?? 0;
  },
});

// Ensures a row exists; grants 1 welcome credit to new emails (TimeRepublik
// pattern: start with something to spend). Returns the balance before charge.
export const ensureAndGrantWelcome = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const lower = email.toLowerCase();
    const row = await ctx.db
      .query("balances")
      .withIndex("by_email", (q) => q.eq("email", lower))
      .unique();
    if (row) return row.balance;
    await ctx.db.insert("balances", { email: lower, balance: 1 });
    return 1;
  },
});

export const charge = internalMutation({
  args: { email: v.string(), amount: v.number() },
  handler: async (ctx, { email, amount }) => {
    const lower = email.toLowerCase();
    const row = await ctx.db
      .query("balances")
      .withIndex("by_email", (q) => q.eq("email", lower))
      .unique();
    if (!row || row.balance < amount) {
      throw new Error(
        "Not enough time credits. Volunteer an hour to earn one, then request again."
      );
    }
    await ctx.db.patch(row._id, { balance: row.balance - amount });
    return row.balance - amount;
  },
});

export const earn = internalMutation({
  args: { email: v.string(), amount: v.number() },
  handler: async (ctx, { email, amount }) => {
    const lower = email.toLowerCase();
    const row = await ctx.db
      .query("balances")
      .withIndex("by_email", (q) => q.eq("email", lower))
      .unique();
    if (!row) {
      await ctx.db.insert("balances", { email: lower, balance: amount });
      return amount;
    }
    await ctx.db.patch(row._id, { balance: row.balance + amount });
    return row.balance + amount;
  },
});
