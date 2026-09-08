"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { scoreCandidate } from "./matchScoring";

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
    try {
      await runMatchPipeline(ctx, requestId, history);
    } catch (err) {
      // Nebius calls take ~20s each and do time out in practice (ETIMEDOUT
      // observed in testing). Without this the request sat in "searching"
      // forever and the user watched a spinner that would never resolve.
      console.error("buildAndMatch failed", err);
      await ctx.runMutation(internal.requests.updateStatus, {
        requestId,
        status: "failed",
        matchReasoning:
          "The matching service didn't respond in time. Your request is saved — please try again.",
      });
    }
  },
});

// Retries transient upstream failures. Nebius occasionally times out under
// load; one retry converts most of those into a normal (if slower) match
// instead of a dead request.
async function withRetry<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`${label} failed, retrying once`, err);
    return await fn();
  }
}

async function runMatchPipeline(
  ctx: any,
  requestId: any,
  history: Array<{ role: "user" | "assistant"; content: string }>
) {
  {
    const profile: { category: string; summary: string; expectedMinutes?: number; language?: string } = await withRetry(
      "closeProfile",
      () => ctx.runAction(internal.nebius.closeProfile, { history, mode: "need" })
    );

    const embedding: number[] = await withRetry("embed", () =>
      ctx.runAction(internal.nebius.embed, { text: profile.summary })
    );

    // Persist the detected conversation language: the LLM wrote the summary
    // in English for matching, but the user reads everything in their own
    // language (status page, reasoning, tips).
    const detectedLanguage =
      typeof profile.language === "string" && profile.language.trim().length > 0
        ? profile.language.trim().slice(0, 8).toLowerCase()
        : undefined;

    await ctx.runMutation(internal.requests.updateStatus, {
      requestId,
      status: "searching",
      needSummary: profile.summary,
      embedding,
      expectedMinutes:
        profile.expectedMinutes === 15 || profile.expectedMinutes === 30
          ? profile.expectedMinutes
          : 60,
      ...(detectedLanguage ? { language: detectedLanguage } : {}),
    });

    // Scheduling overlap: the requester's slots (empty = ASAP, no constraint).
    const reqDoc: { preferredSlots?: string[]; preferredTime?: string; language?: string } | null =
      await ctx.runQuery(api.requests.get, { requestId });
    const reqSlots = reqDoc?.preferredSlots ?? [];
    const reqLanguage = reqDoc?.language ?? detectedLanguage ?? "en";

    const volunteers: Array<{
      _id: string;
      category: string;
      profileSummary: string;
      embedding: number[];
      matchCount?: number;
      isVirtual?: boolean;
      slots?: string[];
      availability?: string;
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

    // Top-K by shared retrieval scoring (K=3) before handing the decision to
    // the LLM. One function scores everywhere (production, eval, red-team),
    // combining cosine similarity with the breadth penalty (anti stuffing),
    // the load penalty (anti congestion: busy volunteers yield to fresh ones),
    // a lexical bonus (offsets flatter non-native embeddings when the right
    // keywords are present), and the virtual penalty (humans first, AI fallback).
    const scored = volunteers
      .map((v) => ({
        id: v._id,
        summary: v.profileSummary,
        score: scoreCandidate(embedding, profile.summary, v, reqSlots),
        availability: v.availability ?? v.slots?.join(", ") ?? "",
        isVirtual: v.isVirtual,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const decision: { chosenId: string | null; reasoning: string } = await withRetry(
      "decideMatch",
      () =>
        ctx.runAction(internal.nebius.decideMatch, {
          needSummary: profile.summary,
          candidates: scored,
          preferredTime: reqDoc?.preferredTime ?? undefined,
          language: reqLanguage,
        })
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
      isVirtual: chosen?.isVirtual ?? false,
    });

    // Congestion accounting: the chosen volunteer's load grows, so future
    // matches slightly prefer fresher volunteers (see loadPenalty).
    await ctx.runMutation(internal.volunteers.recordMatch, {
      volunteerId: decision.chosenId as any,
    });
  }
}

// Generates the video call room via Daily.co once the match is confirmed.
export const createRoom = internalAction({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    // Request shape now includes isVirtual (added to schema above).
    const reqDoc = await ctx.runQuery(api.requests.get, { requestId });
    const isVirtual = reqDoc?.isVirtual ?? false;

    // If the volunteer is virtual (AI), we don't need a Daily.co room.
    // Instead, make the Aria AI helper instantly available for text chat
    // during the session. This guarantees the user always gets help.
    if (isVirtual) {
      await ctx.runMutation(internal.requests.setRoomUrl, {
        requestId,
        roomUrl: "/ai-help", // link to Aria instant helper
      });
      await ctx.runMutation(internal.requests.updateStatus, {
        requestId,
        status: "confirmed",
      });
      return;
    }

    // Both sides have already agreed to meet by this point, so a silent
    // failure here is the worst one in the product: the status page would
    // sit on "generating your room" forever with no way forward. Retry, and
    // if it still fails say so instead of hanging.
    const roomName = `one-hour-${requestId.slice(0, 8)}-${Date.now()}`;

    const createDailyRoom = async () => {
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
      if (!res.ok || !data.url) {
        throw new Error(
          `Daily.co room creation failed (${res.status}): ${data?.error ?? data?.info ?? "no url returned"}`
        );
      }
      return data.url as string;
    };

    try {
      const url = await withRetry("createRoom", createDailyRoom);
      await ctx.runMutation(internal.requests.setRoomUrl, { requestId, roomUrl: url });
    } catch (err) {
      console.error("createRoom failed", err);
      // Back to match_found, NOT failed: the match is still good, only the
      // room is missing, so confirming again must be allowed to retry.
      // Parking here in "failed" would break the promise in the message.
      await ctx.runMutation(internal.requests.updateStatus, {
        requestId,
        status: "match_found",
        matchReasoning:
          "We found your match, but couldn't create the video room. Please try confirming again.",
      });
    }
  },
});
