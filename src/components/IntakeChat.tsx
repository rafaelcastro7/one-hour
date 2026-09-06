"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

type Message = { role: "user" | "assistant"; content: string };

export function IntakeChat({
  mode,
  onDone,
}: {
  mode: "need" | "offer";
  onDone: (history: Message[]) => void;
}) {
  const runIntakeStep = useAction(api.nebius.runIntakeStep);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        mode === "need"
          ? "Hi! Tell me in your own words what you need, and in which category (tech or languages)."
          : "Hi! Tell me in your own words what you can offer as a volunteer (tech or languages) and your availability.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const newHistory: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const reply = await runIntakeStep({ history: newHistory, mode });

      if (reply.startsWith("READY_TO_CLOSE")) {
        onDone(newHistory);
        return;
      }

      setMessages([...newHistory, { role: "assistant", content: reply }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg">
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
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
          <div className="self-start text-neutral-500 text-sm px-2">Thinking...</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
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
    </div>
  );
}
