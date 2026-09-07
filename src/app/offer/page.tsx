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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 0 && emailValid && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const rawOffer = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
      await registerVolunteer({ name: name.trim(), email: email.trim(), category, rawOffer, history });
      setStep("done");
    } catch {
      setSubmitError("Couldn't save your profile. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Tell us what you can offer</h1>
      {step !== "done" && (
        <ol className="flex items-center gap-2 text-xs text-neutral-500" aria-label="Progress">
          {["Chat", "Details"].map((label, i) => {
            const currentIndex = step === "chat" ? 0 : 1;
            return (
              <li key={label} className="flex items-center gap-2">
                <span className={i === currentIndex ? "text-amber-400 font-semibold" : i < currentIndex ? "text-emerald-400" : ""}>
                  {i + 1}. {label}
                </span>
                {i === 0 && <span aria-hidden="true">→</span>}
              </li>
            );
          })}
        </ol>
      )}

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
          <label htmlFor="offer-name" className="sr-only">Your name</label>
          <input
            id="offer-name"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="offer-email" className="sr-only">Your email</label>
          <input
            id="offer-email"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="Your email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="offer-category" className="sr-only">Category</label>
          <select
            id="offer-category"
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
              {submitting ? "Saving..." : "Activate my profile"}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg">Thank you! Your profile is under review.</p>
          <p className="text-sm text-neutral-400">
            A human admin verifies every volunteer before activation, to make
            sure the person asking for help is in good hands. We&apos;ll email
            you as soon as you&apos;re active.
          </p>
          {/* Volunteer-side of the safety gap: an explicit no-blame exit, so
              a volunteer who lands in a session beyond tech/language help
              knows the right move is to step back and point to real support,
              not to push through something they're not equipped for. */}
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-left text-sm text-neutral-300 space-y-2">
            <p className="font-medium">A note on boundaries</p>
            <p className="text-neutral-400">
              You&apos;re here to help with tech or language practice. If a
              conversation turns out to need medical, legal, or mental-health
              support, that&apos;s not on you to carry — it&apos;s completely
              okay to gently end the session and point the person to{" "}
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline"
              >
                professional help
              </a>
              . Stepping back when something is out of scope is the right call,
              not a failure.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
