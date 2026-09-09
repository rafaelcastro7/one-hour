import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Communities (TimeRepublik-style themed groups): a named home for people
// around a topic. Members join by email (no auth); the creator is the first
// member. Names are unique so links and word-of-mouth stay unambiguous.

export const createCommunity = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.optional(v.union(v.literal("tech"), v.literal("languages"))),
    email: v.string(),
  },
  handler: async (ctx, { name, description, category, email }) => {
    const cleanName = name.trim().slice(0, 60);
    if (cleanName.length < 3) throw new Error("Give your community a name (3+ characters).");
    if (!description.trim()) throw new Error("Describe what the community is for.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      throw new Error("That email doesn't look valid.");
    }
    const existing = await ctx.db
      .query("communities")
      .withIndex("by_name", (q) => q.eq("name", cleanName))
      .unique();
    if (existing) throw new Error("A community with that name already exists.");
    const lower = email.toLowerCase().trim();
    return await ctx.db.insert("communities", {
      name: cleanName,
      description: description.trim().slice(0, 280),
      category,
      memberEmails: [lower],
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("communities").take(100);
    rows.sort((a, b) => b.memberEmails.length - a.memberEmails.length);
    return rows.map((community) => ({
      _id: community._id,
      name: community.name,
      description: community.description,
      category: community.category,
      memberCount: community.memberEmails.length,
    }));
  },
});

// Undo a join. Founder leaving an empty community deletes it.
export const leave = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, { name, email }) => {
    const lower = email.toLowerCase().trim();
    const c = await ctx.db
      .query("communities")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (!c) throw new Error("Community not found.");
    if (!c.memberEmails.includes(lower)) throw new Error("You're not a member.");
    const rest = c.memberEmails.filter((m) => m !== lower);
    if (rest.length === 0) {
      await ctx.db.delete(c._id);
      return { memberCount: 0, deleted: true };
    }
    await ctx.db.patch(c._id, { memberEmails: rest });
    return { memberCount: rest.length, deleted: false };
  },
});

export const join = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, { name, email }) => {
    const lower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) {
      throw new Error("That email doesn't look valid.");
    }
    const c = await ctx.db
      .query("communities")
      .withIndex("by_name", (q) => q.eq("name", name))
      .unique();
    if (!c) throw new Error("Community not found.");
    if (c.memberEmails.includes(lower)) throw new Error("You're already a member.");
    await ctx.db.patch(c._id, { memberEmails: [...c.memberEmails, lower] });
    return { memberCount: c.memberEmails.length + 1 };
  },
});
