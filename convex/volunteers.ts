import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Registers a volunteer with their profile still open (called from the
// frontend right after the intake conversation ends).
export const register = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    category: v.union(v.literal("tech"), v.literal("languages")),
    rawOffer: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("volunteers", {
      name: args.name,
      email: args.email,
      category: args.category,
      rawOffer: args.rawOffer,
      profileSummary: "",
      embedding: [],
      availability: "",
      verified: false, // manual human gate before activation
      active: false,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.volunteers.finishProfile, {
      volunteerId: id,
      history: args.history,
    });

    return id;
  },
});

export const finishProfile = internalMutation({
  args: {
    volunteerId: v.id("volunteers"),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, { volunteerId, history }) => {
    await ctx.scheduler.runAfter(0, internal.volunteersActions.buildProfileAction, {
      volunteerId,
      history,
    });
  },
});

// List of volunteers pending manual approval (admin panel)
export const pendingApproval = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("volunteers")
      .filter((q) => q.eq(q.field("verified"), false))
      .collect();
  },
});

export const approve = mutation({
  args: { volunteerId: v.id("volunteers") },
  handler: async (ctx, { volunteerId }) => {
    const volunteer = await ctx.db.get(volunteerId);
    if (!volunteer) throw new Error("Volunteer not found");

    // A volunteer with no embedding can never be retrieved, so approving one
    // would silently produce a member who exists in the admin list but is
    // invisible to matching forever. Usually means intake hit a timeout.
    if (volunteer.embedding.length === 0) {
      throw new Error(
        "This volunteer has no profile embedding (intake likely failed). Re-run their intake before approving."
      );
    }

    await ctx.db.patch(volunteerId, { verified: true, active: true });
  },
});

export const listActive = query({
  args: { category: v.optional(v.union(v.literal("tech"), v.literal("languages"))) },
  handler: async (ctx, { category }) => {
    const all = await ctx.db
      .query("volunteers")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const withEmbeddings = all.filter((v) => v.embedding.length > 0);
    return category ? withEmbeddings.filter((v) => v.category === category) : withEmbeddings;
  },
});
