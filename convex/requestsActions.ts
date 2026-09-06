"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Pipeline completo: cierra el perfil de la necesidad, genera embedding,
// busca los top-K candidatos por similaridad, y llama a la capa de decisión
// del LLM para elegir el match final -- esta es la pieza central del producto.
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
      status: "buscando",
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
        status: "sin_match",
      });
      return;
    }

    // Top-K por similaridad de coseno (K=3) antes de pasarle la decisión al LLM
    const scored = volunteers
      .map((v) => ({
        id: v._id,
        summary: v.profileSummary,
        score: cosineSimilarity(embedding, v.embedding),
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
        status: "sin_match",
        matchReasoning: decision.reasoning,
      });
      return;
    }

    const chosen = scored.find((c) => c.id === decision.chosenId);

    await ctx.runMutation(internal.requests.updateStatus, {
      requestId,
      status: "match_encontrado",
      matchedVolunteerId: decision.chosenId as any,
      matchScore: chosen?.score ?? 0,
      matchReasoning: decision.reasoning,
    });
  },
});

// Genera la sala de videollamada via Daily.co al confirmar el match.
export const createRoom = internalAction({
  args: { requestId: v.id("requests") },
  handler: async (ctx, { requestId }) => {
    const roomName = `una-hora-${requestId.slice(0, 8)}-${Date.now()}`;

    const res = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.round(Date.now() / 1000) + 60 * 60 * 2, // expira en 2hs
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
