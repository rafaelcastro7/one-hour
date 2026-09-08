"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { PipelineTips } from "./PipelineTips";
import { useLanguage } from "@/app/language-context";

type Message = { role: "user" | "assistant"; content: string };

export function IntakeChat({
  mode,
  onDone,
  onRefused,
}: {
  mode: "need" | "offer";
  onDone: (history: Message[]) => void;
  onRefused?: (kind: "time" | "crisis") => void;
}) {
  const runIntakeStep = useAction(api.nebius.runIntakeStep);
  const { language } = useLanguage();
  const es = language === "es";
  const greeting =
    mode === "need"
      ? es
        ? "¡Hola! Cuéntame con tus palabras qué necesitas y en qué categoría (tech o idiomas)."
        : "Hi! Tell me in your own words what you need, and in which category (tech or languages)."
      : es
        ? "¡Hola! Cuéntame con tus palabras qué puedes ofrecer como voluntario (tech o idiomas) y tu disponibilidad."
        : "Hi! Tell me in your own words what you can offer as a volunteer (tech or languages) and your availability.";
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!input.trim() || loading) return;
    const newHistory: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await runIntakeStep({ history: newHistory, mode });
      if (!reply || typeof reply.done !== "boolean") {
        throw new Error("Empty response from the assistant.");
      }
      if (reply.refused) {
        onRefused?.(reply.refused);
        return;
      }
      if (reply.done) {
        onDone(newHistory);
        return;
      }
      if (!reply.message) {
        throw new Error("Empty response from the assistant.");
      }
      setMessages([...newHistory, { role: "assistant", content: reply.message }]);
    } catch {
      setError(es ? "El asistente no respondió a tiempo. Tu mensaje quedó guardado — intenta enviarlo de nuevo." : "The assistant didn't respond in time. Your message is saved — try sending it again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-lg">
      <div className="flex flex-col gap-3 max-h-96 overflow-y-auto" aria-live="polite">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
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
            <PipelineTips mode={mode} messageCount={messages.length} lang={language} />
          </div>
        )}
        {error && (
          <div className="self-start text-red-300 text-sm px-2" role="alert">{error}</div>
        )}
      </div>

      <div className="flex gap-2">
        <label htmlFor="intake-input" className="sr-only">{es ? "Escribe tu mensaje" : "Type your message"}</label>
        <input
          id="intake-input"
          className="flex-1 rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          placeholder={es ? "Escribe aquí..." : "Type here..."}
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
          {es ? "Enviar" : "Send"}
        </button>
      </div>
    </div>
  );
}
