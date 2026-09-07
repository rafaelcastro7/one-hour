"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

// Linkup (production-grade web search API for AI) integration.
//
// Two genuine uses in 1hour, both read-only verifications an admin runs:
//  1. verifyResource -- checks a crisis/help URL is alive and returns real
//     content (via /fetch), so the safety screen never links a dead page.
//  2. searchRegistry -- grounds a volunteer credential check with cited web
//     sources (via /search), supporting the manual approval gate instead of
//     trusting a self-declared title.
//
// Setup (needs a free account key, then):
//   npx convex env set LINKUP_API_KEY ... [--prod]
// Without the key both actions fail with an explicit error -- never silently.

const LINKUP_BASE = "https://api.linkup.so/v1";

function getKey(): string {
  const key = process.env.LINKUP_API_KEY;
  if (!key) {
    throw new Error(
      "LINKUP_API_KEY is not set on this deployment. Create a free key at https://app.linkup.so and run: npx convex env set LINKUP_API_KEY ..."
    );
  }
  return key;
}

export const verifyResource = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }) => {
    const res = await fetch(`${LINKUP_BASE}/fetch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      throw new Error(`Linkup /fetch failed with HTTP ${res.status}.`);
    }
    const data = (await res.json()) as {
      markdown?: string;
      title?: string;
    };
    const content = data.markdown ?? "";
    return {
      alive: content.length > 0,
      title: data.title ?? null,
      snippet: content.slice(0, 300),
    };
  },
});

export const searchRegistry = action({  args: { query: v.string() },
  handler: async (_ctx, { query }) => {
    const res = await fetch(`${LINKUP_BASE}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        depth: "standard",
        outputType: "sourcedAnswer",
      }),
    });
    if (!res.ok) {
      throw new Error(`Linkup /search failed with HTTP ${res.status}.`);
    }
    const data = (await res.json()) as {
      answer?: string;
      sources?: Array<{ url?: string; name?: string }>;
    };
    return {
      answer: (data.answer ?? "").slice(0, 1000),
      sources: (data.sources ?? [])
        .slice(0, 5)
        .map((s) => ({ url: s.url ?? null, name: s.name ?? null })),
    };
  },
});

// Internal web grounding for Aria (the AI helper): fast live sources for a
// user question. Called server-to-server from nebius.aiHelpStep so every AI
// answer can cite real pages instead of relying on model memory alone.
// Failures resolve to empty sources -- help still works, just uncited.
export const groundHelp = internalAction({
  args: { query: v.string() },
  handler: async (_ctx, { query }) => {
    try {
      const res = await fetch(`${LINKUP_BASE}/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
          depth: "standard",
          outputType: "sourcedAnswer",
        }),
      });
      if (!res.ok) return { answer: "", sources: [] as Array<{ url: string | null; name: string | null }> };
      const data = (await res.json()) as {
        answer?: string;
        sources?: Array<{ url?: string; name?: string }>;
      };
      return {
        answer: (data.answer ?? "").slice(0, 800),
        sources: (data.sources ?? [])
          .slice(0, 3)
          .map((s) => ({ url: s.url ?? null, name: s.name ?? null })),
      };
    } catch {
      return { answer: "", sources: [] as Array<{ url: string | null; name: string | null }> };
    }
  },
});
