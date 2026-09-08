"use client";

import { useState } from "react";
import { useLanguage } from "@/app/language-context";

// Pre-session screening. Peer-support research (e.g. the JMIR analysis of
// 7 Cups) documents the failure mode this guards against: someone books
// "language practice" while actually in crisis, and an untrained volunteer
// is left holding a situation they can't handle. Manual approval vets the
// volunteer, not the session, so this closes the gap on the requester side:
// name the role boundary up front, and route anyone in crisis to real help
// instead of into a match.
//
// It is deliberately not a diagnosis or a gate that judges the person -- it
// states what One Hour is and isn't, and makes the crisis path one tap away.

export function SafetyScreen({ onContinue }: { onContinue: () => void }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <div className="flex flex-col gap-5 w-full max-w-md">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 space-y-3">
        <p className="text-sm text-neutral-300">
          {es ? (
            <>One Hour te conecta con un <strong>voluntario</strong> por una hora de ayuda en <strong>tech o práctica de idiomas</strong>. Los voluntarios son gente amable regalando su tiempo — no profesionales licenciados, ni un servicio de apoyo o emergencias.</>
          ) : (
            <>One Hour connects you with a <strong>volunteer</strong> for an hour of help with <strong>tech or language practice</strong>. Volunteers are kind people giving their time — not licensed professionals, and not a support or emergency service.</>
          )}
        </p>
        <p className="text-sm text-neutral-400">
          {es
            ? "Si lo que necesitas es ayuda médica, legal o de salud mental, o estás en cualquier tipo de crisis, contacta un servicio profesional — eso no lo puede cubrir con seguridad un chat voluntario de una hora."
            : "If what you need is medical, legal, or mental-health help, or if you're in any kind of crisis, please reach out to a professional service — that's not something a one-hour volunteer chat can safely cover."}
        </p>
      </div>

      <details className="bg-red-950/30 border border-red-500/30 rounded-xl p-4 text-sm">
        <summary className="cursor-pointer text-red-300 font-medium">
          {es ? "¿En crisis o necesitas ayuda urgente ahora?" : "In crisis or need urgent help now?"}
        </summary>
        <div className="mt-3 space-y-2 text-neutral-300">
          <p>
            {es
              ? "No estás solo. Si estás en peligro inmediato, contacta tu número local de emergencias."
              : "You're not alone. If you're in immediate danger, contact your local emergency number."}
          </p>
          <p>
            {es ? "Líneas gratuitas y confidenciales por país en " : "Free, confidential crisis lines by country are listed at "}{" "}
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
      </details>

      <label className="flex items-start gap-3 text-sm text-neutral-300">
        <input
          type="checkbox"
          className="mt-1"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
        <span>
          {es
            ? "Entiendo que esto es un voluntario de ayuda tech o de idiomas, no un servicio profesional ni de emergencias."
            : "I understand this is a volunteer for tech or language help, not a professional or emergency service."}
        </span>
      </label>

      <button
        disabled={!acknowledged}
        onClick={onContinue}
        className="rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2.5 text-sm disabled:opacity-40"
      >
        {es ? "Continuar" : "Continue"}
      </button>
    </div>
  );
}
