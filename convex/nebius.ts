"use node";

import OpenAI from "openai";
import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Nebius Token Factory is 100% compatible with the OpenAI API --
// we just swap base_url and api_key.
function getClient() {
  return new OpenAI({
    baseURL: "https://api.tokenfactory.nebius.com/v1/",
    apiKey: process.env.NEBIUS_API_KEY,
  });
}

const CHAT_MODEL = "meta-llama/Llama-3.3-70B-Instruct";
const EMBEDDING_MODEL = "Qwen/Qwen3-Embedding-8B";

/**
 * Short conversational interview: given the message history with the user,
 * the LLM decides whether it needs to ask more or can already close the
 * profile with a structured summary (structured output).
 */
export const runIntakeStep = action({
  args: {
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    mode: v.union(v.literal("need"), v.literal("offer")), // asks for help vs. offers help
  },
  handler: async (ctx, { history, mode }) => {
    const client = getClient();

    const languageNote =
      `IMPORTANT: always reply in the SAME language the person is writing in ` +
      `(auto-detect it from their messages -- support at least English, Spanish, ` +
      `Chinese, and French fluently). Never switch languages on your own.`;

    const systemPrompt =
      mode === "need"
        ? `You are a brief, warm interviewer for a volunteering hub ("One Hour"). ` +
          `Your job is to understand, in at most 3-4 questions, what help the person ` +
          `needs (category: tech or languages), how urgent it is, and their preferred ` +
          `language. Ask one question at a time, in a human, friendly tone, never like ` +
          `a form. When you have enough information, respond EXACTLY with the text ` +
          `"READY_TO_CLOSE" followed by a one-sentence summary of the need (the summary ` +
          `itself should be in English regardless of the conversation language, since ` +
          `it's used internally for matching). ${languageNote}`
        : `You are a brief, warm interviewer for a volunteering hub ("One Hour"). ` +
          `Your job is to understand, in at most 3-4 questions, what the person can ` +
          `offer as a volunteer (category: tech or languages), their level/experience, ` +
          `and their availability. Ask one question at a time, in a human, friendly ` +
          `tone, never like a form. When you have enough information, respond EXACTLY ` +
          `with the text "READY_TO_CLOSE" followed by a one-sentence summary of what ` +
          `they offer (the summary itself should be in English regardless of the ` +
          `conversation language, since it's used internally for matching). ${languageNote}`;

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      temperature: 0.7,
    });

    return completion.choices[0].message.content ?? "";
  },
});

/**
 * Closes the profile: takes the full history and produces a structured
 * summary (JSON mode) with category, normalized text, urgency, etc.
 */
export const closeProfile = internalAction({
  args: {
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    mode: v.union(v.literal("need"), v.literal("offer")),
  },
  handler: async (ctx, { history, mode }) => {
    const client = getClient();

    const transcript = history
      .map((m) => `${m.role === "user" ? "Person" : "Interviewer"}: ${m.content}`)
      .join("\n");

    const instruction =
      mode === "need"
        ? `Analyze this conversation where someone requests volunteer help and return a JSON ` +
          `with: category ("tech" or "languages"), summary (one-sentence summary, in English, ` +
          `of what they need and why -- rich in specific detail for semantic matching, not ` +
          `generic), urgency ("low", "medium", "high"), language (preferred language).`
        : `Analyze this conversation where someone offers volunteer help and return a JSON ` +
          `with: category ("tech" or "languages"), summary (one-sentence summary, in English, ` +
          `of what they offer and their experience -- rich in specific detail for semantic ` +
          `matching, not generic), availability (free text of their availability), language ` +
          `(language in which they can help).`;

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    return JSON.parse(completion.choices[0].message.content ?? "{}");
  },
});

/**
 * Generates the embedding of a text (need or offer) for semantic matching.
 */
export const embed = internalAction({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const client = getClient();
    const res = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return res.data[0].embedding;
  },
});

/**
 * Decision layer: given the need text and the top-K candidates by embedding
 * similarity, the LLM picks the best match and explains why (function
 * calling / structured output) -- this is the piece that can "save" a match
 * the embedding alone would have picked wrong.
 */
export const decideMatch = internalAction({
  args: {
    needSummary: v.string(),
    candidates: v.array(
      v.object({
        id: v.string(),
        summary: v.string(),
        score: v.number(),
      })
    ),
  },
  handler: async (ctx, { needSummary, candidates }) => {
    if (candidates.length === 0) {
      return { chosenId: null, reasoning: "No volunteers available right now." };
    }

    const client = getClient();
    const candidateList = candidates
      .map((c, i) => `${i + 1}. [id=${c.id}] ${c.summary} (similarity: ${c.score.toFixed(3)})`)
      .join("\n");

    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content:
            `You are the final decision engine of a volunteering matcher. I give you a ` +
            `need and a list of candidate volunteers already pre-filtered by semantic ` +
            `similarity. Your job is to pick the BEST real match (not necessarily the ` +
            `highest numeric score -- sometimes the text reveals that the most similar in ` +
            `wording isn't the most suitable in practice). Respond in JSON: {"chosenId": "<id or null>", "reasoning": "<brief explanation in English>"}.`,
        },
        {
          role: "user",
          content: `Need: ${needSummary}\n\nCandidates:\n${candidateList}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(completion.choices[0].message.content ?? "{}");
  },
});
