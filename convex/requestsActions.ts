"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { cosineSimilarity, penalisedScore } from "./matchScoring";

// Full pipeline: closes the need profile, generates its embedding, finds
// the top-K candidates by similarity, and calls the LLM decision layer to
// pick the final match -- this is the core piece of the product.
export const buildAndMatch = internalAction({
  args: {
    requestId: v.id("requests"),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, { requestId, history }) => {
    const profile: { category: string; summary: string } = await ctx.runAction(
      internal.nebius.closeProfile,
      { history, mode: "need" }
    );

    const embedding: number[] = await ctx.runAction(internal.nebius.embed, {
      text: profile.summary,
    });

    await ctx.runMutation(internal.requests.updateStatus, {
      requestId,
      status: "searching",
      needSummary: profile.summary,
      embedding,
    });

    const volunteers: Array<{
      _id: string;
      category: string;
      profileSummary: string;
      embedding: number[];
    }> = await ctx.runQuery(internal.volunteersQueries.getActiveVolunteers, {
      category: profile.category,
    });

    if (volunteers.length === 0) {
      await ctx.runMutation(internal.requests.updateStatus, {
        requestId,
        status: "no_match",
      });
      return;
    }

    // Top-K by cosine similarity (K=3) before handing the decision to the
    // LLM. The score is breadth-penalised: profiles that claim every skill
    // at once otherwise reach the top-K for every query and crowd out real
    // volunteers. See convex/matchScoring.ts and the harness in
    // convex/adversarialTests.ts that demonstrates the attack.
    const scored = volunteers
      .map((v) => ({
        id: v._id,
        summary: v.profileSummary,
        score: penalisedScore(cosineSimilarity(embedding, v.embedding), v.profileSummary),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const decision: { chosenId: string | null; reasoning: string } = await ctx.runAction(
      internal.nebius.decideMatch,
      { needSummary: profile.summary, candidates: scored }
    );

    if (!decision.chosenId) {
      await ctx.runMutation(internal.requests.updateStatus, {
        requestId,
        status: "no_match",
        matchReasoning: decision.reasoning,
      });
      return;
    }

    const chosen = scored.find((c) => c.id === decision.chosenId);

    await ctx.runMutation(internal.requests.updateStatus, {
      requestId,
      status: "match_found",
      matchedVolunteerId: decision.chosenId as any,
      matchScore: chosen?.score ?? 0,
      matchReasoning: decision.reasoning,
    });
  },
});

// Generates the video call room via Daily.co once the match is confirmed.
export const createRoom = internalAction({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const roomName = `one-hour-${requestId.slice(0, 8)}-${Date.now()}`;

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.round(Date.now() / 1000) + 60 * 60 * 2, // expires in 2h
          enable_chat: true,
        },
      }),
    });

    const data = await res.json();

    if (data.url) {
      await ctx.runMutation(internal.requests.setRoomUrl, {
        requestId,
        roomUrl: data.url,
      });
    }
  },
});
