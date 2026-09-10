"use client";

import { useMutation } from "convex/react";
import { Fragment, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { IntakeChat } from "@/components/IntakeChat";
import { QUIZZES, QUIZ_PASS, levelFor } from "@/components/quizBank";
import { useLanguage } from "@/app/language-context";
import {
  BLOCKS,
  DAYS,
  DAY_LABEL,
  DAY_LABEL_ES,
  BLOCK_LABEL,
  BLOCK_LABEL_ES,
  PRESETS,
  PRESET_LABEL_ES,
  PresetId,
  SlotId,
} from "@/components/availability";

type Message = { role: "user" | "assistant"; content: string };

export default function OfferPage() {
  const registerVolunteer = useMutation(api.volunteers.register);
  const { language } = useLanguage();
  const es = language === "es";

  const [step, setStep] = useState<"chat" | "form" | "quiz" | "done">("chat");
  const [refused, setRefused] = useState<null | "time" | "crisis">(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUser, setLinkedinUser] = useState("");
  const [category, setCategory] = useState<"tech" | "languages">("tech");
  const linkedinUrl = `https://www.linkedin.com/in/${linkedinUser.trim()}`;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  // Strict: only the bare username counts. If the user pastes a full URL we
  // show a targeted error instead of silently building a broken profile link.
  const linkedinValid = /^[A-Za-z0-9-]{3,100}$/.test(linkedinUser.trim());
  const [answers, setAnswers] = useState<Array<number | null>>([null, null, null]);
  const [preset, setPreset] = useState<PresetId>("weekday-evenings");
  const [customizing, setCustomizing] = useState(false);
  const [customSlots, setCustomSlots] = useState<SlotId[]>([]);
  // Ensure slots are never empty: if a preset is selected, use its slots;
  // otherwise fall back to the default "weekday-evenings" slots.
  const basePreset = PRESETS.find((p) => p.id === preset);
  const slots: SlotId[] = customizing
    ? customSlots
    : basePreset?.slots ?? PRESETS[0]?.slots ?? [];
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canContinue = name.trim().length > 0 && emailValid && linkedinValid;

  const questions = QUIZZES[category];
  const score = answers.filter((a, i) => a === questions[i].answer).length;
  const quizDone = answers.every((a) => a !== null);
  const canSubmit = quizDone && score >= QUIZ_PASS && slots.length > 0 && !submitting;

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
        linkedinUrl,
        quizScore: score,
        skillLevel: levelFor(score),
        slots: [...slots],
      });
      setStep("done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (es) {
        setSubmitError(
          msg.includes("LinkedIn")
            ? "LinkedIn inválido: usa tu nombre de usuario o pega tu link linkedin.com/in/."
            : msg.includes("availability slot")
              ? "Elige al menos un horario de disponibilidad."
              : "No pudimos guardar tu perfil. Revisa tu conexión e inténtalo de nuevo."
        );
      } else {
        setSubmitError(msg || "Couldn't save your profile. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-8 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">{es ? "¿Qué puedes ofrecer?" : "What can you offer?"}</h1>
      {step !== "done" && (
        <ol className="flex items-center gap-2 text-xs text-neutral-500" aria-label="Progress">
          {[es ? "Chat" : "Chat", es ? "Datos" : "Details", es ? "Prueba" : "Skills check"].map((label, i) => {
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
          <p className="text-lg">{es ? "Las sesiones duran una hora completa." : "Sessions last one full hour."}</p>
          <p className="text-sm text-neutral-400">
            {es
              ? "Cada sesión de 1hour es una hora completa — ese es el compromiso mínimo, sin excepciones. Si puedes dar una hora completa, empieza de nuevo y avísale al agente."
              : "Every 1hour session is a full hour — that's the minimum commitment, with no exceptions. If you can give a full hour, start over and let the agent know."}
          </p>
          <button
            onClick={() => {
              setRefused(null);
              setHistory([]);
            }}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            {es ? "Empezar de nuevo — sí puedo dar una hora" : "Start over — I can give an hour"}
          </button>
        </div>
      )}

      {refused === "crisis" && (
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg">{es ? "Gracias por contarnos." : "Thank you for telling us."}</p>
          <p className="text-sm text-neutral-400">
            {es ? (
              <>Una hora voluntaria no es la ayuda adecuada para lo que estás pasando. Contacta un servicio profesional — líneas gratuitas y confidenciales por país en{" "}
                <a
                  href="https://findahelpline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline"
                >
                  findahelpline.com
                </a>
                .</>
            ) : (
              <>A volunteer hour isn&apos;t the right kind of help for what you&apos;re
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
                .</>
            )}
          </p>
        </div>
      )}

      {step === "form" && (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <p className="text-sm text-neutral-400">
            {es
              ? "Tus datos — verificamos tu identidad con LinkedIn antes de emparejarte:"
              : "Great. Your details — we verify identity with LinkedIn before anyone can be matched:"}
          </p>
          <label htmlFor="offer-name" className="sr-only">{es ? "Tu nombre" : "Your name"}</label>
          <input
            id="offer-name"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder={es ? "Tu nombre" : "Your name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label htmlFor="offer-email" className="sr-only">{es ? "Tu correo" : "Your email"}</label>
          <input
            id="offer-email"
            className="rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm"
            placeholder={es ? "Tu correo" : "Your email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label htmlFor="offer-linkedin" className="sr-only">LinkedIn username</label>
          <div className="flex items-center rounded-lg bg-neutral-900 border border-neutral-700 px-4 py-2.5 text-sm focus-within:border-amber-400">
            <span className="text-neutral-500 shrink-0">linkedin.com/in/</span>
            <input
              id="offer-linkedin"
              className="flex-1 bg-transparent outline-none px-1"
              placeholder="your-username"
              value={linkedinUser}
              onChange={(e) => setLinkedinUser(e.target.value.replace(/\s/g, ""))}
            />
          </div>
          {!linkedinValid && linkedinUser.length > 0 && (
            <p className="text-xs text-red-300" role="alert">
              {es
                ? "Usa solo tu nombre de usuario (letras, números, guiones), sin pegar la URL completa."
                : "Use just your LinkedIn username (letters, numbers, dashes) — not the full URL."}
            </p>
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
            <option value="languages">{es ? "Idiomas" : "Languages"}</option>
          </select>
          <fieldset>
            <legend className="text-sm text-neutral-400 mb-2">{es ? "¿Cuándo sueles estar libre para sesiones?" : "When are you usually free for sessions?"}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Availability preset">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={!customizing && preset === p.id}
                  onClick={() => {
                    setPreset(p.id);
                    setCustomizing(false);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                    !customizing && preset === p.id
                      ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                      : "border-neutral-700 text-neutral-300 hover:border-amber-400"
                  }`}
                >
                  {es ? PRESET_LABEL_ES[p.id] : p.label}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={customizing}
                onClick={() => setCustomizing(true)}
                className={`rounded-lg px-3 py-2 text-sm border transition-colors ${
                  customizing
                    ? "bg-amber-400 text-neutral-900 font-semibold border-amber-400"
                    : "border-neutral-700 text-neutral-300 hover:border-amber-400"
                }`}
              >
                {es ? "Personalizar…" : "Custom…"}
              </button>
            </div>
            {customizing && (
              <div className="mt-3 grid grid-cols-4 gap-1 text-xs" role="group" aria-label="Custom availability grid">
                <span />
                {BLOCKS.map((b) => (
                  <span key={b} className="text-neutral-500 text-center capitalize">{es ? BLOCK_LABEL_ES[b] : b}</span>
                ))}
                {DAYS.map((d) => (
                  <Fragment key={d}>
                    <span className="text-neutral-500 capitalize self-center">{es ? DAY_LABEL_ES[d] : DAY_LABEL[d]}</span>
                    {BLOCKS.map((b) => {
                      const id = `${d}-${b}` as SlotId;
                      const on = customSlots.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          aria-label={`${es ? DAY_LABEL_ES[d] : DAY_LABEL[d]} ${es ? BLOCK_LABEL_ES[b] : b}`}
                          onClick={() =>
                            setCustomSlots((s) => (on ? s.filter((x) => x !== id) : [...s, id]))
                          }
                          className={`rounded px-1 py-1.5 border transition-colors ${
                            on
                              ? "bg-amber-400 border-amber-400 text-neutral-900 font-bold"
                              : "border-neutral-700 text-neutral-600"
                          }`}
                        >
                          {on ? "✓" : "·"}
                        </button>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            )}
          </fieldset>
          {/* The missing step this form always needed: without a Continue
              button there was no path from Details to the Skills check. */}
          {(!canContinue || slots.length === 0) && (
            <p className="text-xs text-neutral-500" role="status">
              {!canContinue
                ? es
                  ? "Completa nombre, correo válido y usuario de LinkedIn para continuar."
                  : "Fill in your name, a valid email and your LinkedIn username to continue."
                : es
                  ? "Elige cuándo sueles estar libre (o marca casillas en Personalizar)."
                  : "Pick when you're usually free (or tick boxes under Custom)."}
            </p>
          )}
          <button
            type="button"
            onClick={() => canContinue && slots.length > 0 && setStep("quiz")}
            disabled={!canContinue || slots.length === 0}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {es ? "Continuar a la prueba" : "Continue to skills check"}
          </button>
        </div>
      )}

      {step === "quiz" && (
        <div className="flex flex-col gap-5 w-full max-w-md">
          <p className="text-sm text-neutral-400">
            {es
              ? `Chequeo rápido — responde al menos ${QUIZ_PASS} de 3 bien para ser elegible. Esto también define tu nivel para el matching.`
              : `Quick check — answer at least ${QUIZ_PASS} of 3 correctly to be eligible for approval. This also sets your skill level for matching.`}
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
              {es ? `Puntaje: ${score}/3 (${levelFor(score)})` : `Score: ${score}/3 (${levelFor(score)})`}
              {score < QUIZ_PASS && (
                <span className="text-red-300"> — {es ? `necesitas ${QUIZ_PASS} para continuar.` : `you need ${QUIZ_PASS} to continue.`}</span>
              )}
              {slots.length === 0 && (
                <span className="text-red-300"> {es ? "Elige al menos un horario (vuelve un paso atrás)." : "Pick at least one availability slot (go back one step)."}</span>
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
              {es ? "Atrás" : "Back"}
            </button>
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {submitting ? (es ? "Guardando..." : "Saving...") : (es ? "Activar mi perfil" : "Activate my profile")}
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="text-center max-w-md space-y-4">
          <p className="text-lg">{es ? "¡Gracias! Tu perfil está en revisión." : "Thank you! Your profile is under review."}</p>
          <p className="text-sm text-neutral-400">
            {es
              ? "Un admin humano verifica cada voluntario antes de activarlo, para que quien pide ayuda esté en buenas manos. Te avisaremos por correo en cuanto estés activo."
              : "A human admin verifies every volunteer before activation, to make sure the person asking for help is in good hands. We'll email you as soon as you're active."}
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
