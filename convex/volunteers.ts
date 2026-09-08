import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { normalizeLinkedIn } from "./linkedin";

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
    linkedinUrl: v.string(),
    quizScore: v.number(),
    skillLevel: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    slots: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Accept a bare username ("rafa") or a full URL the user pasted.
    // normalizeLinkedIn is unit-tested in convex/linkedin.test.ts.
    const linkedinUrl = normalizeLinkedIn(args.linkedinUrl);
    if (!linkedinUrl) {
      throw new Error(
        "A valid LinkedIn profile is required: use your username (letters, numbers, dashes) or paste your linkedin.com/in/ link."
      );
    }
    if (args.slots.length === 0) {
      throw new Error("Pick at least one availability slot.");
    }
    const id = await ctx.db.insert("volunteers", {
      name: args.name,
      email: args.email.toLowerCase().trim(),
      category: args.category,
      rawOffer: args.rawOffer,
      profileSummary: "",
      embedding: [],
      availability: "",
      verified: false, // manual human gate before activation
      active: false,
      linkedinUrl,
      quizScore: args.quizScore,
      skillLevel: args.skillLevel,
      slots: args.slots,
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

    // Minimum-knowledge gate: at least 2/3 quiz answers plus a LinkedIn URL.
    // Mirrors QUIZ_PASS in src/components/quizBank.ts (kept as a literal here
    // so the rule holds even if the frontend bank changes).
    if (!volunteer.linkedinUrl) {
      throw new Error("This volunteer has no LinkedIn profile on file. Ask them to register again with one.");
    }
    if ((volunteer.quizScore ?? 0) < 2) {
      throw new Error(
        `Quiz score ${volunteer.quizScore ?? 0}/3 is below the 2/3 minimum. They need to retake the skills check.`
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
    // Public directory shows the same membership as matching: verified,
    // active, embedded. Pending rows stay invisible until a human approves.
    const withEmbeddings = all.filter((v) => v.verified && v.active && v.embedding.length > 0);
    return category ? withEmbeddings.filter((v) => v.category === category) : withEmbeddings;
  },
});

// Congestion accounting: called each time a volunteer is matched, so the
// load penalty (see loadPenalty in matchScoring.ts) spreads future matches.
export const recordMatch = internalMutation({
  args: { volunteerId: v.id("volunteers") },
  handler: async (ctx, { volunteerId }) => {
    const vol = await ctx.db.get(volunteerId);
    if (!vol) return;
    await ctx.db.patch(volunteerId, { matchCount: (vol.matchCount ?? 0) + 1 });
  },
});
