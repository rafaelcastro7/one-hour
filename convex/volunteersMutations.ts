import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Inserts a synthetic demo volunteer already verified and active, so the
// matching pipeline has a realistic pool to reason over. Used only by
// convex/seedVolunteers.ts -- real volunteers always go through the
// conversational intake and the manual approval gate.
export const insertSeedVolunteer = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    category: v.union(v.literal("tech"), v.literal("languages")),
    rawOffer: v.string(),
    profileSummary: v.string(),
    availability: v.string(),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("volunteers", {
      ...args,
      verified: true,
      active: true,
      createdAt: Date.now(),
    });
  },
});

// Removes the red-team fixtures seeded by convex/adversarialTests.ts so
// they can never leak into a real matching run.
export const deleteAdversarialTests = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("volunteers").collect();
    let deleted = 0;
    for (const vol of all) {
      if (vol.name.startsWith("ADVERSARIAL TEST")) {
        await ctx.db.delete(vol._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

// Clears throwaway rows left behind by manual pipeline testing, so a demo
// or a fresh deployment doesn't show "Test Volunteer" next to real profiles.
export const deleteScratchVolunteers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("volunteers").collect();
    let deleted = 0;
    for (const vol of all) {
      if (/^(Test Volunteer|Rehearsal|Broken Intake Test)/i.test(vol.name)) {
        await ctx.db.delete(vol._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

export const saveProfile = internalMutation({
  args: {
    volunteerId: v.id("volunteers"),
    profileSummary: v.string(),
    availability: v.string(),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.volunteerId, {
      profileSummary: args.profileSummary,
      availability: args.availability,
      embedding: args.embedding,
    });
  },
});
