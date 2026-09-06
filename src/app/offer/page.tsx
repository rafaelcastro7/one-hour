"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { IntakeChat } from "@/components/IntakeChat";

type Message = { role: "user" | "assistant"; content: string };

export default function OfferPage() {
  const registerVolunteer = useMutation(api.volunteers.register);
  const router = useRouter();

  const [step, setStep] = useState<"chat" | "form" | "done">("chat");
  const [history, setHistory] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"tech" | "languages">("tech");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    const rawOffer = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
    await registerVolunteer({ name, email, category, rawOffer, history });
    setStep("done");
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Tell us what you can offer</h1>

      {step === "chat" && (
        <IntakeChat
          mode="offer"
          onDone={(h) => {
            setHistory(h);
            setStep("form");
          }}
        />
      )}

      {step === "form" && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <p className="text-sm text-neutral-400">
            Great. One last step to activate your volunteer profile:
          </p>
          <input
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value as "tech" | "languages")}
          >
            <option value="tech">Tech</option>
            <option value="languages">Languages</option>
          </select>
          <button
            onClick={submit}
            disabled={submitting || !name || !email}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Activate my profile"}
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="text-center max-w-sm space-y-3">
          <p className="text-lg">Thank you! Your profile is under review.</p>
          <p className="text-sm text-neutral-400">
            A human admin verifies every volunteer before activation, to make
            sure the person asking for help is in good hands. We&apos;ll email
            you as soon as you&apos;re active.
          </p>
        </div>
      )}
    </main>
  );
}
