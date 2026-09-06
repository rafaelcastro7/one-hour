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
    // Same failure mode the request pipeline had: a Nebius timeout here left
    // the volunteer with an empty summary and embedding, so they could never
    // be matched and nothing said why. Retry once, and if it still fails
    // leave a visible marker for the human approving them rather than a
    // silently broken row.
    try {
      const profile: { summary: string; availability?: string } = await withRetry(() =>
        ctx.runAction(internal.nebius.closeProfile, { history, mode: "offer" })
      );

      const embedding: number[] = await withRetry(() =>
        ctx.runAction(internal.nebius.embed, { text: profile.summary })
      );

      await ctx.runMutation(internal.volunteersMutations.saveProfile, {
        volunteerId,
        profileSummary: profile.summary,
        availability: profile.availability ?? "",
        embedding,
      });
    } catch (err) {
      console.error("buildProfileAction failed", err);
      await ctx.runMutation(internal.volunteersMutations.saveProfile, {
        volunteerId,
        profileSummary:
          "[profile could not be generated — the matching service timed out. Re-run intake before approving.]",
        availability: "",
        embedding: [],
      });
    }
  },
});

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}
