"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { PipelineTips } from "@/components/PipelineTips";
import { AriaAvatar } from "@/components/AriaAvatar";

type Message = { role: "user" | "assistant"; content: string };

export default function AiHelpPage() {
  const aiHelpStep = useAction(api.nebius.aiHelpStep);
  const [category, setCategory] = useState<"tech" | "languages" | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Aria, the AI volunteer — instant help while no human is around. What do you need?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!input.trim() || loading || !category) return;
    const newHistory: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const reply = await aiHelpStep({ history: newHistory, category });
      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } catch {
      setError("Aria didn't respond in time — try sending your message again.");
    } finally {
      setLoading(false);
    }
  }

  if (!category) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-6 bg-neutral-950 text-neutral-50 text-center">
        <h1 className="text-2xl font-bold">Instant AI help</h1>
        <p className="text-sm text-neutral-400 max-w-sm">
          No human available right now? Aria answers instantly. Pick a topic —
          a human volunteer is still the better choice for anything sensitive.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setCategory("tech")}
            className="rounded-xl bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            Tech
          </button>
          <button
            onClick={() => setCategory("languages")}
            className="rounded-xl border-2 border-neutral-700 px-6 py-3 font-semibold hover:border-amber-400 transition-colors"
          >
            Languages
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-6 bg-neutral-950 text-neutral-50">
      <div className="flex items-center gap-3">
        <AriaAvatar size={52} />
        <h1 className="text-2xl font-bold">Chatting with Aria (AI)</h1>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-lg max-h-96 overflow-y-auto" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}-${m.content.length}`}
            className={`rounded-lg px-4 py-2.5 text-sm max-w-[85%] ${
              m.role === "user"
                ? "self-end bg-amber-400 text-neutral-900"
                : "self-start bg-neutral-800 text-neutral-100"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="self-start px-2">
            <PipelineTips />
          </div>
        )}
        {error && (
          <div className="self-start text-red-300 text-sm px-2" role="alert">{error}</div>
        )}
      </div>
      <div className="flex gap-2 w-full max-w-lg">
        <label htmlFor="ai-input" className="sr-only">Type your message</label>
        <input
          id="ai-input"
          className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          placeholder="Type here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
