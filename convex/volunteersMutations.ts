import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

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
