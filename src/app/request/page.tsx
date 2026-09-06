"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { IntakeChat } from "@/components/IntakeChat";

type Message = { role: "user" | "assistant"; content: string };

export default function PedirPage() {
  const createRequest = useMutation(api.requests.create);
  const router = useRouter();

  const [step, setStep] = useState<"chat" | "form">("chat");
  const [history, setHistory] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"tech" | "idiomas">("tech");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const rawNeed = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
    const id = await createRequest({ name, email, category, rawNeed, history });
    router.push(`/estado/${id}`);
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Contanos qué necesitás</h1>

      {step === "chat" && (
        <IntakeChat
          mode="need"
          onDone={(h) => {
            setHistory(h);
            setStep("form");
          }}
        />
      )}

      {step === "form" && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <p className="text-sm text-neutral-400">
            Ya entendimos qué necesitás. Un último paso para buscarte el match:
          </p>
          <input
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Tu email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as "tech" | "idiomas")}
          >
            <option value="tech">Tecnología</option>
            <option value="idiomas">Idiomas</option>
          </select>
          <button
            onClick={submit}
            disabled={submitting || !name || !email}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? "Buscando tu match..." : "Buscar mi match"}
          </button>
        </div>
      )}
    </main>
  );
}
