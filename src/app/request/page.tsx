"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { IntakeChat } from "@/components/IntakeChat";
import { SafetyScreen } from "@/components/SafetyScreen";
import { requestSlotOptions, userTimeZone } from "@/components/availability";
import { TEMPLATES, TemplateId } from "@/components/templates";
import { useLanguage } from "@/app/language-context";
import { useMemo } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function RequestPage() {
  const createRequest = useMutation(api.requests.create);
  const router = useRouter();
  const { language } = useLanguage();
  const es = language === "es";

  const [step, setStep] = useState<"safety" | "chat" | "form">("safety");
  const [refused, setRefused] = useState(false);
  const [history, setHistory] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<"tech" | "languages">("tech");
  const slotOptions = useMemo(() => requestSlotOptions(new Date(), es ? "es" : "en"), [es]);
  const [slotIndex, setSlotIndex] = useState(0);
  const preferredTime = slotOptions[slotIndex].label;
  const preferredSlots = slotOptions[slotIndex].slots;
  const preferredTz = useMemo(() => userTimeZone(), []);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<TemplateId>("custom");
  const [preferredVolunteerId, setPreferredVolunteerId] = useState<string | null>(null);

  // Recurring booking: /request?volunteer=<id> boosts that volunteer in
  // scoring (requested-again bonus). Read client-side to stay prerender-safe.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("volunteer");
    if (id) setPreferredVolunteerId(id);
  }, []);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length > 0 && emailValid && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const rawNeed = history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
      const id = await createRequest({
        name: name.trim(),
        email: email.trim(),
        category,
        rawNeed,
        history,
        preferredTime,
        preferredSlots: [...preferredSlots],
        preferredTz,
        language,
        template: templateId === "custom" ? undefined : templateId,
        preferredVolunteerId: (preferredVolunteerId as Id<"volunteers"> | null) ?? undefined,
      });
      router.push(`/status/${id}`);
    } catch (e) {
      // Backend errors arrive in English (single source of truth server-side);
      // map the known cases to the UI language instead of leaking them raw.
      const msg = e instanceof Error ? e.message : "";
      if (es) {
        setSubmitError(
          msg.includes("Not enough time credits")
            ? "Sin créditos de tiempo. Regala una hora como voluntario para ganar uno, e inténtalo de nuevo."
            : "No pudimos crear tu solicitud. Revisa tu conexión e inténtalo de nuevo."
        );
      } else {
        setSubmitError(msg || "Couldn't create your request. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">{es ? "¿Qué necesitas?" : "What do you need?"}</h1>
      <Stepper steps={[es ? "Aviso" : "Safety", "Chat", es ? "Datos" : "Details"]} current={step} />

      {step === "safety" && <SafetyScreen onContinue={() => setStep("chat")} />}

      {step === "chat" && !refused && (
        <IntakeChat
          mode="need"
          onDone={(h) => {
            setHistory(h);
            setStep("form");
          }}
          onRefused={() => setRefused(true)}
        />
      )}

      {refused && (
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
            . If you&apos;re in immediate danger, contact your local emergency number.
          </p>
        </div>
      )}

      {step === "form" && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <p className="text-sm text-neutral-400">
            {es ? "Listo. Un último paso para encontrar tu match:" : "Got it. One last step to find your match:"}
          </p>
          <label htmlFor="req-name" className="sr-only">{es ? "Tu nombre" : "Your name"}</label>
          <input
            id="req-name"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder={es ? "Tu nombre" : "Your name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="req-email" className="sr-only">{es ? "Tu correo" : "Your email"}</label>
          <input
            id="req-email"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder={es ? "Tu correo" : "Your email"}
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
            <option value="languages">{es ? "Idiomas" : "Languages"}</option>
          </select>
          <fieldset>
            <legend className="text-sm text-neutral-400 mb-2">{es ? "¿Qué formato quieres?" : "What format?"}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Template">
              {TEMPLATES.filter((t) => t.category === "either" || t.category === category).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={templateId === t.id}
                  title={es ? t.blurbEs : t.blurb}
                  onClick={() => setTemplateId(t.id)}
                  className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                    templateId === t.id
                      ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                      : "border-neutral-700 text-neutral-300 hover:border-amber-400"
                  }`}
                >
                  {es ? t.labelEs : t.label}
                </button>
              ))}
            </div>
          </fieldset>
          {preferredVolunteerId && (
            <p className="text-xs text-amber-400" role="status">
              {es ? "Reservando de nuevo con tu voluntario anterior — tendrá prioridad en el matching." : "Booking again with your previous volunteer — they'll be prioritized in matching."}
            </p>
          )}
          <fieldset>
            <legend className="text-sm text-neutral-400 mb-2">{es ? "¿Cuándo quieres la sesión?" : "When do you want the session?"} <span className="text-neutral-600">({preferredTz})</span></legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Preferred time">
              {slotOptions.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={slotIndex === i}
                  onClick={() => setSlotIndex(i)}
                  className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                    slotIndex === i
                      ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                      : "border-neutral-700 text-neutral-300 hover:border-amber-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
          {submitError && (
            <p className="text-sm text-red-300" role="alert">{submitError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setStep("chat")}
              disabled={submitting}
              className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm disabled:opacity-50 hover:border-amber-400 transition-colors"
            >
              {es ? "Atrás" : "Back"}
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {submitting ? (es ? "Buscando tu match..." : "Finding your match...") : (es ? "Buscar mi match" : "Find my match")}
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
