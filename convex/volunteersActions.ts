"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Takes a volunteer's interview history, closes it with the LLM (summary +
// normalized category), generates its embedding, and saves everything.
export const buildProfileAction = internalAction({
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
    const profile: { summary: string; availability?: string } = await ctx.runAction(
      internal.nebius.closeProfile,
      { history, mode: "offer" }
    );

    const embedding: number[] = await ctx.runAction(internal.nebius.embed, {
      text: profile.summary,
    });

    await ctx.runMutation(internal.volunteersMutations.saveProfile, {
      volunteerId,
      profileSummary: profile.summary,
      availability: profile.availability ?? "",
      embedding,
    });
  },
});
