import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    category: v.union(v.literal("tech"), v.literal("idiomas")),
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
      status: "buscando",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.requestsActions.buildAndMatch, {
      requestId: id,
      history: args.history,
    });

    return id;
  },
});

// El estado de una solicitud en vivo -- esto es lo que el frontend
// suscribe para ver la reactividad de Convex (buscando -> match encontrado).
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
    await ctx.db.patch(requestId, { status: "confirmado" });
    await ctx.scheduler.runAfter(0, internal.requestsActions.createRoom, { requestId });
  },
});

export const updateStatus = internalMutation({
  args: {
    requestId: v.id("requests"),
    status: v.union(
      v.literal("buscando"),
      v.literal("match_encontrado"),
      v.literal("confirmado"),
      v.literal("completado"),
      v.literal("sin_match")
    ),
    matchedVolunteerId: v.optional(v.id("volunteers")),
    matchScore: v.optional(v.number()),
    matchReasoning: v.optional(v.string()),
    needSummary: v.optional(v.string()),
    embedding: v.optional(v.array(v.number())),
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
