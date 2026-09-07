import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    category: v.union(v.literal("tech"), v.literal("languages")),
    rawNeed: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("requests", {
      name: args.name,
      email: args.email,
      category: args.category,
      rawNeed: args.rawNeed,
      needSummary: "",
      embedding: [],
      status: "searching",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.requestsActions.buildAndMatch, {
      requestId: id,
      history: args.history,
    });

    return id;
  },
});

// Live status of a request -- this is what the frontend subscribes to
// in order to see Convex's reactivity (searching -> match found).
export const get = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) return null;
    const volunteer = req.matchedVolunteerId
      ? await ctx.db.get(req.matchedVolunteerId)
      : null;
    return { ...req, volunteer };
  },
});

export const confirmMatch = mutation({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Request not found");
    if (req.roomUrl) return;
    if (req.status !== "match_found") return;
    await ctx.db.patch(requestId, { status: "confirmed" });
    await ctx.scheduler.runAfter(0, internal.requestsActions.createRoom, { requestId });
  },
});

export const updateStatus = internalMutation({
  args: {
    requestId: v.id("requests"),
    status: v.union(
      v.literal("searching"),
      v.literal("match_found"),
      v.literal("confirmed"),
      v.literal("completed"),
      v.literal("no_match"),
      v.literal("failed")
    ),
    matchedVolunteerId: v.optional(v.id("volunteers")),
    matchScore: v.optional(v.number()),
    matchReasoning: v.optional(v.string()),
    needSummary: v.optional(v.string()),
    embedding: v.optional(v.array(v.number())),
    expectedMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { requestId, ...patch } = args;
    await ctx.db.patch(requestId, patch);
  },
});

export const setRoomUrl = internalMutation({
  args: { requestId: v.id("requests"), roomUrl: v.string() },
  handler: async (ctx, { requestId, roomUrl }) => {
    await ctx.db.patch(requestId, { roomUrl });
  },
});
