"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { IntakeChat } from "@/components/IntakeChat";
import { QUIZZES, QUIZ_PASS, levelFor } from "@/components/quizBank";

type Message = { role: "user" | "assistant"; content: string };

export default function OfferPage() {
  const registerVolunteer = useMutation(api.volunteers.register);
  const router = useRouter();

  const [step, setStep] = useState<"chat" | "form" | "quiz" | "done">("chat");
  const [refused, setRefused] = useState<null | "time" | "crisis">(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [category, setCategory] = useState<"tech" | "languages">("tech");
  const [answers, setAnswers] = useState<Array<number | null>>([null, null, null]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const linkedinValid = /^https:\/\/(www\.)?linkedin\.com\/.+/.test(linkedin.trim());
  const canContinue = name.trim().length > 0 && emailValid && linkedinValid;

  const questions = QUIZZES[category];
  const score = answers.filter((a, i) => a === questions[i].answer).length;
  const quizDone = answers.every((a) => a !== null);
  const canSubmit = quizDone && score >= QUIZ_PASS && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const rawOffer = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
      await registerVolunteer({
        name: name.trim(),
        email: email.trim(),
        category,
        rawOffer,
        history,
        linkedinUrl: linkedin.trim(),
        quizScore: score,
        skillLevel: levelFor(score),
      });
      setStep("done");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Couldn't save your profile. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">Tell us what you can offer</h1>
      {step !== "done" && (
        <ol className="flex items-center gap-2 text-xs text-neutral-500" aria-label="Progress">
          {["Chat", "Details", "Skills check"].map((label, i) => {
            const order = ["chat", "form", "quiz"];
            const currentIndex = order.indexOf(step);
            return (
              <li key={label} className="flex items-center gap-2">
                <span className={i === currentIndex ? "text-amber-400 font-semibold" : i < currentIndex ? "text-emerald-400" : ""}>
                  {i + 1}. {label}
                </span>
                {i < 2 && <span aria-hidden="true">→</span>}
              </li>
            );
          })}
        </ol>
      )}

      {step === "chat" && !refused && (
        <IntakeChat
          mode="offer"
          onDone={(h) => {
            setHistory(h);
            setStep("form");
          }}
          onRefused={(kind) => setRefused(kind)}
        />
      )}

      {refused === "time" && (
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg">Sessions last one full hour.</p>
          <p className="text-sm text-neutral-400">
            Every 1hour session is a full hour — that&apos;s the minimum commitment,
            with no exceptions. If you can give a full hour, start over and let
            the agent know.
          </p>
          <button
            onClick={() => {
              setRefused(null);
              setHistory([]);
            }}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            Start over — I can give an hour
          </button>
        </div>
      )}

      {refused === "crisis" && (
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg">Thank you for telling us.</p>
          <p className="text-sm text-neutral-400">
            A volunteer hour isn&apos;t the right kind of help for what you&apos;re
            going through. Please reach out to a professional service — free,
            confidential lines by country are listed at{" "}
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 underline"
            >
              findahelpline.com
            </a>
            .
          </p>
        </div>
      )}

      {step === "form" && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <p className="text-sm text-neutral-400">
            Great. Your details — we verify identity with LinkedIn before anyone
            can be matched:
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
          <label htmlFor="offer-linkedin" className="sr-only">LinkedIn profile URL</label>
          <input
            id="offer-linkedin"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder="LinkedIn profile URL (https://linkedin.com/in/…)"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
          {!linkedinValid && linkedin.length > 0 && (
            <p className="text-xs text-red-300">Enter a valid LinkedIn profile URL.</p>
          )}
          <label htmlFor="offer-category" className="sr-only">Category</label>
          <select
            id="offer-category"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as "tech" | "languages");
              setAnswers([null, null, null]);
            }}
          >
            <option value="tech">Tech</option>
            <option value="languages">Languages</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setStep("chat")}
              className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm hover:border-amber-400 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep("quiz")}
              disabled={!canContinue}
              className="flex-1 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Continue to skills check
            </button>
          </div>
        </div>
      )}

      {step === "quiz" && (
        <div className="flex flex-col gap-5 w-full max-w-md">
          <p className="text-sm text-neutral-400">
            Quick check — answer at least {QUIZ_PASS} of 3 correctly to be eligible
            for approval. This also sets your skill level for matching.
          </p>
          {questions.map((qq, qi) => (
            <fieldset key={qi} className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 space-y-2">
              <legend className="text-sm font-medium px-1">{qq.q}</legend>
              {qq.options.map((opt, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
                  <input
                    type="radio"
                    name={`quiz-${qi}`}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  />
                  {opt}
                </label>
              ))}
            </fieldset>
          ))}
          {quizDone && (
            <p className="text-sm" role="status">
              Score: {score}/3 ({levelFor(score)})
              {score < QUIZ_PASS && (
                <span className="text-red-300"> — you need {QUIZ_PASS} to continue.</span>
              )}
            </p>
          )}
          {submitError && (
            <p className="text-sm text-red-300" role="alert">{submitError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setStep("form")}
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
