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
    preferredTime: v.string(),
    preferredSlots: v.array(v.string()),
    preferredTz: v.string(),
    language: v.optional(v.string()),
    template: v.optional(v.string()),
    preferredVolunteerId: v.optional(v.id("volunteers")),
  },
  handler: async (ctx, args) => {
    // Time economy: every request costs 1 credit; new emails start with 1
    // welcome credit. The error message tells broke users how to earn more.
    // Charge BEFORE the insert (so a broke user never creates a request the
    // pipeline can't serve), but refund if the insert/schedule fails — a
    // lost credit with no request is the worst outcome of this ordering.
    await ctx.runMutation(internal.credits.ensureAndGrantWelcome, { email: args.email });
    await ctx.runMutation(internal.credits.charge, { email: args.email, amount: 1 });

    let id;
    try {
      id = await ctx.db.insert("requests", {
        name: args.name,
        email: args.email.toLowerCase().trim(),
        category: args.category,
        rawNeed: args.rawNeed,
        history: args.history,
        needSummary: "",
        embedding: [],
        status: "searching",
        preferredTime: args.preferredTime,
        preferredSlots: args.preferredSlots,
        preferredTz: args.preferredTz,
        language: args.language ?? "en",
        template: args.template,
        preferredVolunteerId: args.preferredVolunteerId,
        createdAt: Date.now(),
      });

      await ctx.scheduler.runAfter(0, internal.requestsActions.buildAndMatch, {
        requestId: id,
        history: args.history,
      });
    } catch (err) {
      await ctx.runMutation(internal.credits.earn, { email: args.email, amount: 1 });
      throw err;
    }

    return id;
  },
});

// Live status of a request -- this is what the frontend subscribes to
// in order to see Convex's reactivity (searching -> match found).
// The volunteer is projected to an explicit public shape: embeddings are
// matching-internal data, and email/rawOffer/linkedinUrl/quizScore are the
// volunteer's private data — a requester has no business reading them.
// Explicit fields (not a dynamic pick) so the generated client type carries
// every property the status page renders.
export const get = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) return null;
    const volunteer = req.matchedVolunteerId
      ? await ctx.db.get(req.matchedVolunteerId)
      : null;
    if (!volunteer) return { ...req, volunteer };
    return {
      ...req,
      volunteer: {
        _id: volunteer._id,
        name: volunteer.name,
        category: volunteer.category,
        profileSummary: volunteer.profileSummary,
        availability: volunteer.availability,
        slots: volunteer.slots,
        skillLevel: volunteer.skillLevel,
        languages: volunteer.languages,
        isVirtual: volunteer.isVirtual,
        ratingSum: volunteer.ratingSum,
        ratingCount: volunteer.ratingCount,
        noShowCount: volunteer.noShowCount,
      },
    };
  },
});

export const confirmMatch = mutation({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Request not found");
    if (req.roomUrl) return;
    if (req.status !== "match_found") return;
    if (!req.matchedVolunteerId) throw new Error("No volunteer attached to this match.");
    // The volunteer may have been deactivated (or their intake invalidated)
    // between match_found and confirm. Creating a room for a dead match is
    // worse than re-searching: verify membership before committing.
    const vol = await ctx.db.get(req.matchedVolunteerId);
    if (!vol || !vol.active || !vol.verified || vol.embedding.length === 0) {
      const history = (req.history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
      if (history.length === 0) {
        // No stored conversation: re-running the pipeline on an empty
        // transcript would match garbage. Say so instead of matching blind.
        await ctx.db.patch(requestId, {
          status: "failed",
          matchedVolunteerId: undefined,
          matchScore: undefined,
          matchReasoning:
            "Your match became unavailable and the original conversation is gone. Please make a new request.",
          roomUrl: undefined,
          isVirtual: undefined,
        });
        return;
      }
      await ctx.db.patch(requestId, {
        status: "searching",
        matchedVolunteerId: undefined,
        matchScore: undefined,
        matchReasoning: "Your match became unavailable. Finding someone else.",
        roomUrl: undefined,
        isVirtual: undefined,
      });
      await ctx.scheduler.runAfter(0, internal.requestsActions.buildAndMatch, {
        requestId,
        history,
      });
      return;
    }
    await ctx.db.patch(requestId, { status: "confirmed" });
    // For virtual volunteers, set roomUrl to Aria helper link immediately.
    if (req.isVirtual) {
      await ctx.runMutation(internal.requests.setRoomUrl, {
        requestId,
        roomUrl: "/ai-help",
      });
    } else {
      await ctx.scheduler.runAfter(0, internal.requestsActions.createRoom, { requestId });
    }
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
    isVirtual: v.optional(v.boolean()),
    language: v.optional(v.string()),
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

// Sessions portal: every request one email address made, newest first,
// with the matched volunteer attached. The requester's home base.
export const listByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    const out = [];
    for (const req of rows) {
      const volunteer = req.matchedVolunteerId
        ? await ctx.db.get(req.matchedVolunteerId)
        : null;
      out.push({
        ...req,
        volunteer: volunteer
          ? { _id: volunteer._id, name: volunteer.name, isVirtual: volunteer.isVirtual }
          : null,
      });
    }
    return out;
  },
});

// Volunteer side of the portal: every request currently assigned to the
// volunteer with this email. Lets volunteers see who is coming, complete
// sessions and spot no-shows without needing the requester's link.
export const listByVolunteer = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const vol = await ctx.db
      .query("volunteers")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .unique();
    if (!vol) return [];
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) =>
        q.eq("status", "confirmed" as const)
      )
      .collect();
    const mine = rows.filter((r) => r.matchedVolunteerId === vol._id);
    const matched = await ctx.db
      .query("requests")
      .withIndex("by_status", (q) =>
        q.eq("status", "match_found" as const)
      )
      .collect();
    const all = [...mine, ...matched.filter((r) => r.matchedVolunteerId === vol._id)];
    all.sort((a, b) => b.createdAt - a.createdAt);
    return all.map((r) => ({
      _id: r._id,
      name: r.name,
      email: r.email,
      status: r.status,
      preferredTime: r.preferredTime,
      preferredTz: r.preferredTz,
      roomUrl: r.roomUrl,
      requesterRating: r.requesterRating,
      createdAt: r.createdAt,
    }));
  },
});

// Post-session rating, one per side (1-5). Sessions must be COMPLETED:
// rating a merely confirmed session scores a call that may never happen.
// Each side writes its own field once (guarded below). A requester rating
// also feeds the volunteer's public average (ratingSum/ratingCount).
export const submitRating = mutation({
  args: {
    requestId: v.id("requests"),
    side: v.union(v.literal("requester"), v.literal("volunteer")),
    score: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, side, score, review }) => {
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      throw new Error("Score must be an integer from 1 to 5.");
    }
    if (review !== undefined && review.length > 280) {
      throw new Error("Review must be 280 characters or less.");
    }
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Request not found");
    if (req.status !== "completed") {
      throw new Error("You can only rate a completed session. Mark it completed first.");
    }
    if (side === "requester") {
      if (req.requesterRating !== undefined) throw new Error("Already rated.");
      await ctx.db.patch(requestId, {
        requesterRating: score,
        ...(review && review.trim() ? { requesterReview: review.trim().slice(0, 280) } : {}),
      });
      if (req.matchedVolunteerId) {
        const vol = await ctx.db.get(req.matchedVolunteerId);
        if (vol) {
          await ctx.db.patch(vol._id, {
            ratingSum: (vol.ratingSum ?? 0) + score,
            ratingCount: (vol.ratingCount ?? 0) + 1,
            ...(review && review.trim()
              ? { latestReview: review.trim().slice(0, 280), latestReviewer: req.name }
              : {}),
          });
        }
      }
    } else {
      if (req.volunteerRating !== undefined) throw new Error("Already rated.");
      await ctx.db.patch(requestId, { volunteerRating: score });
    }
  },
});

// Marks a confirmed session as done. The volunteer earns 1 time credit.
// Idempotent: completing twice does not pay twice. Virtual (AI) volunteers
// never earn: their address is synthetic and paying it pollutes the ledger.
export const completeSession = mutation({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Request not found");
    if (req.status === "completed") return;
    if (req.status !== "confirmed") throw new Error("Only confirmed sessions can complete.");
    await ctx.db.patch(requestId, { status: "completed" });
    if (req.matchedVolunteerId && !req.isVirtual) {
      const vol = await ctx.db.get(req.matchedVolunteerId);
      if (vol && !vol.isVirtual) {
        await ctx.runMutation(internal.credits.earn, { email: vol.email, amount: 1 });
        await ctx.db.patch(vol._id, { completedCount: (vol.completedCount ?? 0) + 1 });
      }
    }
  },
});

// No-show handling (ADPList's #1 complaint, unanswered there):
// - Volunteer didn't show (reporter "requester"): volunteer's noShowCount
//   grows (visible reliability + scoring penalty), match cleared, pipeline
//   re-runs from the stored history -- the requester never repeats themselves.
// - Requester didn't show (reporter "volunteer"): session completes and the
//   waiting volunteer still earns their credit.
export const reportNoShow = mutation({
  args: {
    requestId: v.id("requests"),
    reporter: v.union(v.literal("requester"), v.literal("volunteer")),
  },
  handler: async (ctx, { requestId, reporter }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Request not found");
    if (req.status !== "confirmed" && req.status !== "match_found") {
      throw new Error("Only active matches can report a no-show.");
    }
    if (reporter === "volunteer") {
      await ctx.db.patch(requestId, { status: "completed" });
      if (req.matchedVolunteerId && !req.isVirtual) {
        const vol = await ctx.db.get(req.matchedVolunteerId);
        if (vol && !vol.isVirtual) {
          await ctx.runMutation(internal.credits.earn, { email: vol.email, amount: 1 });
        }
      }
      return;
    }
    if (req.matchedVolunteerId) {
      const vol = await ctx.db.get(req.matchedVolunteerId);
      if (vol) {
        const strikes = (vol.noShowCount ?? 0) + 1;
        // Three strikes: auto-pause. The volunteer disappears from matching
        // and the directory until a human re-approves them.
        await ctx.db.patch(vol._id, {
          noShowCount: strikes,
          ...(strikes >= 3 ? { active: false } : {}),
        });
      }
    }
    const history = (req.history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    if (history.length === 0) {
      await ctx.db.patch(requestId, {
        status: "failed",
        matchedVolunteerId: undefined,
        matchScore: undefined,
        matchReasoning:
          "The volunteer didn't show up and the original conversation is gone. Please make a new request.",
        roomUrl: undefined,
        isVirtual: undefined,
        requesterRating: undefined,
        volunteerRating: undefined,
      });
      return;
    }
    await ctx.db.patch(requestId, {
      status: "searching",
      matchedVolunteerId: undefined,
      matchScore: undefined,
      matchReasoning: "Previous volunteer didn't show up. Finding someone else.",
      roomUrl: undefined,
      // A requeued search is a fresh match: stale virtual flag and any
      // ratings from the dead session must not leak into the next one.
      isVirtual: undefined,
      requesterRating: undefined,
      volunteerRating: undefined,
    });
    await ctx.scheduler.runAfter(0, internal.requestsActions.buildAndMatch, {
      requestId,
      history,
    });
  },
});
