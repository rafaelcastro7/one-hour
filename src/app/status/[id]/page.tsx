"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { use, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { PipelineTips } from "@/components/PipelineTips";
import { AriaAvatar } from "@/components/AriaAvatar";

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const request = useQuery(api.requests.get, { requestId: id as Id<"requests"> });
  const confirmMatch = useMutation(api.requests.confirmMatch);
  const completeSession = useMutation(api.requests.completeSession);
  const submitRating = useMutation(api.requests.submitRating);
  const reportNoShow = useMutation(api.requests.reportNoShow);
  const checkIn = useMutation(api.requests.checkIn);
  const balance = useQuery(
    api.credits.balanceForRequest,
    request ? { requestId: id as Id<"requests"> } : "skip"
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [myReview, setMyReview] = useState("");

  async function runAction(
    fn: () => Promise<unknown>,
    okMsg: string,
    failMsg: string
  ) {
    setActionMsg(null);
    try {
      await fn();
      setActionMsg(okMsg);
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : failMsg);
    }
  }

  async function handleConfirm() {
    if (confirming) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      await confirmMatch({ requestId: id as Id<"requests"> });
    } catch {
      setConfirmError("Couldn't confirm the match. Try again.");
    } finally {
      setConfirming(false);
    }
  }

  if (request === undefined) {
    return <Centered>Loading...</Centered>;
  }

  if (request === null) {
    return <Centered>We couldn&apos;t find that request.</Centered>;
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-6 bg-neutral-950 text-neutral-50 text-center">
      {request.status === "searching" && (
        <>
          <Spinner />
          <p className="text-lg">{request.language === "es" ? "Encontrando la persona indicada para ti..." : "Finding the right person for you..."}</p>
          <PipelineTips mode="matching" lang={request.language === "es" ? "es" : "en"} />
          {/* The pipeline takes ~35s across two LLM calls, so show which
              stage we're actually in rather than one opaque spinner.
              needSummary lands the moment the first call returns, which is
              what lets us tell the two apart without extra backend state. */}
          {request.needSummary ? (
            <div className="max-w-sm space-y-3">
              <Stage done label={request.language === "es" ? "Entendimos lo que necesitas" : "Understood what you need"} />
              <p className="text-sm text-neutral-400 italic">
                &ldquo;{request.needSummary}&rdquo;
              </p>
              <Stage label={request.language === "es" ? "Comparando con voluntarios disponibles" : "Comparing against available volunteers"} />
            </div>
          ) : (
            <div className="max-w-sm space-y-3">
              <Stage label={request.language === "es" ? "Leyendo tu conversación" : "Reading your conversation"} />
            </div>
          )}
        </>
      )}

      {request.status === "failed" && (
        <>
          <p className="text-lg">{request.language === "es" ? "Algo salió mal de nuestro lado." : "Something went wrong on our side."}</p>
          <p className="text-sm text-neutral-500 max-w-sm">
            {request.matchReasoning ??
              (request.language === "es" ? "El servicio no respondió a tiempo. Tu solicitud está guardada — inténtalo de nuevo." : "The matching service didn't respond in time. Your request is saved — please try again.")}
          </p>
          <Link
            href="/request"
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            {request.language === "es" ? "Intentar de nuevo" : "Try again"}
          </Link>
        </>
      )}

      {request.status === "no_match" && (
        <>
          <p className="text-lg">{request.language === "es" ? "No encontramos a nadie disponible ahora mismo." : "We couldn't find anyone available right now."}</p>
          <p className="text-sm text-neutral-500 max-w-sm">
            {request.matchReasoning ?? (request.language === "es" ? "Intenta más tarde, seguimos sumando voluntarios." : "Try again later, we keep adding volunteers.")}
          </p>
          <Link
            href="/ai-help"
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
          >
            {request.language === "es" ? "Hablar con Aria (IA) ahora" : "Talk to Aria (AI) now"}
          </Link>
          <Link
            href="/request"
            className="rounded-lg border-2 border-neutral-700 text-neutral-100 font-semibold px-6 py-3 hover:border-amber-400 transition-colors"
          >
            {request.language === "es" ? "Hacer otra solicitud" : "Make another request"}
          </Link>
        </>
      )}

      {request.status === "match_found" && request.volunteer && (
        <>
          <p className="text-lg">{request.language === "es" ? "¡Encontramos una coincidencia!" : "We found a match!"}</p>
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm text-left space-y-2">
            <div className="flex items-center gap-3">
              {request.volunteer.isVirtual && <AriaAvatar size={44} />}
              <div>
                <p className="font-semibold">{request.volunteer.name}</p>
                {request.volunteer.isVirtual && (
                  <p className="text-xs text-amber-400 font-medium">{request.language === "es" ? "Voluntario IA — conecta al instante" : "AI volunteer — connects instantly"}</p>
                )}
                {!request.volunteer.isVirtual && (
                  <p className="text-xs text-neutral-500">{request.language === "es" ? "Voluntario real" : "Real volunteer"}</p>
                )}
              </div>
            </div>
            <p className="text-sm text-neutral-400">{request.volunteer.profileSummary}</p>
            {typeof request.volunteer.ratingCount === "number" && request.volunteer.ratingCount > 0 && (
              <p className="text-xs text-amber-400">
                ★ {((request.volunteer.ratingSum ?? 0) / request.volunteer.ratingCount).toFixed(1)} · {request.volunteer.ratingCount} session{request.volunteer.ratingCount > 1 ? "s" : ""}
              </p>
            )}
            {typeof request.expectedMinutes === "number" && (
              <p className="text-xs text-amber-400">
                {request.language === "es"
                  ? `Necesitan unos ${request.expectedMinutes} minutos de ayuda${request.expectedMinutes < 60 ? " — cabe en tu hora" : ""}`
                  : `They need about ${request.expectedMinutes} minutes of help${request.expectedMinutes < 60 ? " — fits inside your hour" : ""}`}
              </p>
            )}
            {request.preferredTime && (
              <p className="text-xs text-neutral-500">
                {request.language === "es" ? "Sesión deseada: " : "Session wanted: "}{request.preferredTime}
                {request.preferredTz ? ` (${request.preferredTz})` : ""}
              </p>
            )}
            {request.template && (
              <p className="text-xs text-neutral-500">
                {request.language === "es" ? "Formato: " : "Format: "}{request.template.replace(/-/g, " ")}
              </p>
            )}
            {request.volunteer.availability && !request.volunteer.isVirtual && (
              <p className="text-xs text-neutral-500">
                {request.language === "es"
                  ? `${request.volunteer.name.split(" ")[0]} suele estar libre: ${request.volunteer.availability}`
                  : `${request.volunteer.name.split(" ")[0]} is usually free: ${request.volunteer.availability}`}
              </p>
            )}
            {request.matchReasoning && (
              <p className="text-sm text-neutral-300 mt-2">{request.matchReasoning}</p>
            )}
          </div>
          {request.volunteer.isVirtual && (
            <p className="text-sm text-amber-300 mt-2">
              {request.language === "es"
                ? "Ayuda IA disponible durante la sesión — Aria responde en tu idioma"
                : "AI help available during the session — Aria replies in your language"}
            </p>
          )}
          {confirmError && (
            <p className="text-sm text-red-300" role="alert">{request.language === "es" ? "No se pudo confirmar. Inténtalo de nuevo." : confirmError}</p>
          )}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3 disabled:opacity-50"
          >
            {confirming ? (request.language === "es" ? "Confirmando..." : "Confirming...") : (request.language === "es" ? "Confirmar y agendar la llamada" : "Confirm and schedule the call")}
          </button>
        </>
      )}

      {request.status === "confirmed" && (
        <>
          <p className="text-lg">{request.language === "es" ? "¡Match confirmado!" : "Match confirmed!"}</p>
          {request.roomUrl ? (
            <a
              href={request.roomUrl}
              target={request.roomUrl === "/ai-help" ? undefined : "_blank"}
              rel="noopener noreferrer"
              className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
            >
              {request.roomUrl === "/ai-help"
                ? request.language === "es" ? "Chatear con Aria (IA) ahora" : "Chat with Aria (AI) now"
                : request.language === "es" ? "Unirse a la videollamada" : "Join the video call"}
            </a>
          ) : (
            <p className="text-sm text-neutral-500">{request.language === "es" ? "Generando tu sala de video..." : "Generating your video call room..."}</p>
          )}
          {typeof balance === "number" && (
            <p className="text-xs text-neutral-500">{request.language === "es" ? `Tu balance de tiempo: ${balance}h` : `Your time balance: ${balance}h`}</p>
          )}
          {actionMsg && (
            <p className="text-sm text-neutral-300 max-w-sm" role="status">{actionMsg}</p>
          )}
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            <button
              onClick={() =>
                runAction(
                  () => checkIn({ requestId: id as Id<"requests">, side: "requester" }),
                  request.language === "es" ? "Check-in listo: estás aquí." : "Checked in: you're here.",
                  request.language === "es" ? "No se pudo registrar." : "Couldn't check in."
                )
              }
              disabled={!!request.requesterHereAt}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-amber-400 transition-colors disabled:opacity-50"
            >
              {request.requesterHereAt
                ? (request.language === "es" ? "✓ Estoy aquí" : "✓ I'm here")
                : (request.language === "es" ? "Estoy aquí (solicitante)" : "I'm here (requester)")}
            </button>
            <button
              onClick={() =>
                runAction(
                  () => checkIn({ requestId: id as Id<"requests">, side: "volunteer" }),
                  request.language === "es" ? "Check-in listo: voluntario aquí." : "Checked in: volunteer here.",
                  request.language === "es" ? "No se pudo registrar." : "Couldn't check in."
                )
              }
              disabled={!!request.volunteerHereAt}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-amber-400 transition-colors disabled:opacity-50"
            >
              {request.volunteerHereAt
                ? (request.language === "es" ? "✓ Voluntario aquí" : "✓ Volunteer here")
                : (request.language === "es" ? "Estoy aquí (voluntario)" : "I'm here (volunteer)")}
            </button>
          </div>
          <p className="text-xs text-neutral-500 max-w-sm">
            {request.language === "es"
              ? "El check-in deja constancia de asistencia. Los reportes de ausencia son manuales hasta que exista una hora de inicio exacta."
              : "Check-in records attendance. No-shows stay manual until sessions have an exact start time."}
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            <button
              onClick={() =>
                runAction(
                  () => completeSession({ requestId: id as Id<"requests"> }),
                  request.language === "es" ? "Sesión completada — tu voluntario ganó 1 hora." : "Session completed — your volunteer earned 1 hour.",
                  request.language === "es" ? "No se pudo completar la sesión." : "Couldn't complete the session."
                )
              }
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-amber-400 transition-colors"
            >
              {request.language === "es" ? "Marcar sesión completada" : "Mark session completed"}
            </button>
            <button
              onClick={() =>
                runAction(
                  () => reportNoShow({ requestId: id as Id<"requests">, reporter: "requester" }),
                  request.language === "es" ? "Reportado. Buscándote a alguien más — sin repetirte." : "Reported. Finding you someone else — no need to repeat yourself.",
                  request.language === "es" ? "No se pudo reportar la ausencia." : "Couldn't report the no-show."
                )
              }
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:border-red-400 transition-colors"
            >
              {request.language === "es" ? "El voluntario no apareció" : "Volunteer didn't show"}
            </button>
          </div>
          {request.requesterRating === undefined ? (
            <p className="text-sm text-neutral-500 max-w-sm">
              {request.language === "es"
                ? "La calificación se habilita al completar la sesión — calificar antes premiaría una llamada que quizá nunca ocurrió."
                : "Rating unlocks when the session completes — rating earlier would score a call that may never have happened."}
            </p>
          ) : (
            <p className="text-sm text-neutral-500">{request.language === "es" ? `Calificaste esta sesión ${request.requesterRating}/5. ¡Gracias!` : `You rated this session ${request.requesterRating}/5. Thanks!`}</p>
          )}
        </>
      )}

      {request.status === "completed" && (
        <>
          <p className="text-lg">{request.language === "es" ? "Sesión completada. ¡Gracias!" : "Session completed. Thank you!"}</p>
          {typeof balance === "number" && (
            <p className="text-xs text-neutral-500">{request.language === "es" ? `Tu balance de tiempo: ${balance}h` : `Your time balance: ${balance}h`}</p>
          )}
          {request.requesterRating === undefined ? (
            <div className="max-w-sm space-y-2">
              <p className="text-sm text-neutral-400">{request.language === "es" ? "¿Cómo estuvo tu voluntario?" : "How was your volunteer?"}</p>
              <div className="flex justify-center gap-1" role="radiogroup" aria-label={request.language === "es" ? "Califica tu voluntario" : "Rate your volunteer"}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={myScore === s}
                    aria-label={`${s} star${s > 1 ? "s" : ""}`}
                    onClick={() => setMyScore(s)}
                    className={`text-2xl ${myScore >= s ? "text-amber-400" : "text-neutral-700"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  myScore > 0 &&
                  runAction(
                    () =>
                      submitRating({
                        requestId: id as Id<"requests">,
                        side: "requester",
                        score: myScore,
                        review: myReview.trim() ? myReview.trim() : undefined,
                      }),
                    request.language === "es" ? "Gracias — tu calificación ayuda a futuros matches." : "Thanks — your rating helps future matches.",
                    request.language === "es" ? "No se pudo guardar tu calificación." : "Couldn't save your rating."
                  )
                }
                disabled={myScore === 0}
                className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm disabled:opacity-50"
              >
                {request.language === "es" ? "Enviar calificación" : "Send rating"}
              </button>
              <label htmlFor="review-text" className="sr-only">{request.language === "es" ? "Reseña escrita (opcional)" : "Written review (optional)"}</label>
              <textarea
                id="review-text"
                rows={2}
                maxLength={280}
                value={myReview}
                onChange={(e) => setMyReview(e.target.value)}
                placeholder={request.language === "es" ? "Cuéntalo en palabras (opcional, 280)…" : "Say it in words (optional, 280)…"}
                className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
            </div>
          ) : (
            <p className="text-sm text-neutral-500">{request.language === "es" ? `Calificaste esta sesión ${request.requesterRating}/5. ¡Gracias!` : `You rated this session ${request.requesterRating}/5. Thanks!`}</p>
          )}
          {request.matchedVolunteerId && !request.volunteer?.isVirtual && (
            <Link
              href={`/request?volunteer=${request.matchedVolunteerId}`}
              className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-6 py-3"
            >
              {request.language === "es" ? `Reservar de nuevo con ${request.volunteer?.name.split(" ")[0] ?? "tu voluntario"}` : `Book again with ${request.volunteer?.name.split(" ")[0] ?? "your volunteer"}`}
            </Link>
          )}
          <Link
            href="/request"
            className="rounded-lg border-2 border-neutral-700 px-6 py-3 font-semibold hover:border-amber-400 transition-colors"
          >
            {request.language === "es" ? "Pedir otra hora" : "Request another hour"}
          </Link>
        </>
      )}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-50">
      {children}
    </main>
  );
}

function Stage({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={done ? "text-emerald-400" : "text-neutral-600"}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-neutral-300" : "text-neutral-500"}>{label}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-amber-400 animate-spin" role="status" aria-label="Loading" />
  );
}
