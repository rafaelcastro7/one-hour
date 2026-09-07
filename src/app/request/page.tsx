"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { IntakeChat } from "@/components/IntakeChat";
import { SafetyScreen } from "@/components/SafetyScreen";

type Message = { role: "user" | "assistant"; content: string };

export default function RequestPage() {
  const createRequest = useMutation(api.requests.create);
  const router = useRouter();

  const [step, setStep] = useState<"safety" | "chat" | "form">("safety");
  const [history, setHistory] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"tech" | "languages">("tech");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 0 && emailValid && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const rawNeed = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
      const id = await createRequest({ name: name.trim(), email: email.trim(), category, rawNeed, history });
      router.push(`/status/${id}`);
    } catch {
      setSubmitError("Couldn't create your request. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Tell us what you need</h1>
      <Stepper steps={["Safety", "Chat", "Details"]} current={step} />

      {step === "safety" && <SafetyScreen onContinue={() => setStep("chat")} />}

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
            Got it. One last step to find your match:
          </p>
          <label htmlFor="req-name" className="sr-only">Your name</label>
          <input
            id="req-name"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="req-email" className="sr-only">Your email</label>
          <input
            id="req-email"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="req-category" className="sr-only">Category</label>
          <select
            id="req-category"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as "tech" | "languages")}
          >
            <option value="tech">Tech</option>
            <option value="languages">Languages</option>
          </select>
          {submitError && (
            <p className="text-sm text-red-300" role="alert">{submitError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setStep("chat")}
              disabled={submitting}
              className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm disabled:opacity-50 hover:border-amber-400 transition-colors"
            >
              Back
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {submitting ? "Finding your match..." : "Find my match"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: string }) {
  const order = ["safety", "chat", "form"];
  const currentIndex = order.indexOf(current);
  return (
    <ol className="flex items-center gap-2 text-xs text-neutral-500" aria-label="Progress">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={
              i < currentIndex
                ? "text-emerald-400"
                : i === currentIndex
                  ? "text-amber-400 font-semibold"
                  : ""
            }
          >
            {i + 1}. {label}
          </span>
          {i < steps.length - 1 && <span aria-hidden="true">→</span>}
        </li>
      ))}
    </ol>
  );
}
