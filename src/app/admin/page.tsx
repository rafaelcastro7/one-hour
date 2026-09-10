"use client";

import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useLanguage } from "@/app/language-context";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  // Debounce: the query fires on every keystroke with whatever is typed so
  // far, and a partial key is (correctly) rejected server-side. In Next the
  // rejected query surfaced as a route error that tore the page down. Commit
  // the key only after the user pauses, so exactly one request happens — with
  // the value they actually meant to enter.
  const [committedKey, setCommittedKey] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setCommittedKey(adminKey), 350);
    return () => clearTimeout(t);
  }, [adminKey]);
  const pending = useQuery(
    api.volunteers.pendingApproval,
    committedKey ? { adminKey: committedKey } : "skip"
  );
  const approve = useMutation(api.volunteers.approve);
  const { language } = useLanguage();
  const es = language === "es";
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(id: Id<"volunteers">) {
    setError(null);
    try {
      await approve({ volunteerId: id, adminKey });
    } catch (e) {
      // Approving a volunteer whose intake failed is rejected server-side;
      // surface that instead of letting the click appear to do nothing.
      setError(e instanceof Error ? e.message : (es ? "No se pudo aprobar este voluntario." : "Could not approve this volunteer."));
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 gap-6 bg-neutral-950 text-neutral-50">
      <h1 className="text-2xl font-bold">{es ? "Aprobación de voluntarios" : "Volunteer approval"}</h1>
      <p className="text-sm text-neutral-400 max-w-md text-center">
        {es
          ? "Puerta humana manual: verifica la identidad antes de activar, especialmente en categorías sensibles."
          : "Manual human gate: verify identity before activation, especially in sensitive categories."}
      </p>
      <input
        className="w-full max-w-md rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-amber-400"
        placeholder={es ? "Clave de aprobacion" : "Approval key"}
        type="password"
        value={adminKey}
        onChange={(e) => setAdminKey(e.target.value)}
      />

      {error && (
        <p className="max-w-2xl text-sm text-red-400 bg-red-950/40 border border-red-500/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <div className="w-full max-w-2xl flex flex-col gap-4">
        {pending === undefined && <p className="text-neutral-500">{es ? "Cargando..." : "Loading..."}</p>}
        {pending?.length === 0 && (
          <p className="text-neutral-500">{es ? "Sin voluntarios pendientes de aprobación." : "No volunteers pending approval."}</p>
        )}
        {pending?.map((v) => (
          <div
            key={v._id}
            className="bg-neutral-900 border border-neutral-700 rounded-xl p-5 flex justify-between items-start gap-4"
          >
            <div>
              <p className="font-semibold">
                {v.name} <span className="text-xs text-neutral-500">({v.category})</span>
              </p>
              <p className="text-sm text-neutral-300 mt-2">{v.profileSummary || v.rawOffer}</p>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                {v.linkedinUrl ? (
                  <a
                    href={v.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline"
                  >
                    {es ? "Perfil de LinkedIn" : "LinkedIn profile"}
                  </a>
                ) : (
                  <span className="text-red-300">{es ? "Sin LinkedIn — no se puede aprobar" : "No LinkedIn — cannot approve"}</span>
                )}
                <span className="text-neutral-500">
                  {es ? "Prueba" : "Quiz"}: {v.quizScore ?? 0}/3
                </span>
              </div>
            </div>
            <button
              onClick={() => handleApprove(v._id as Id<"volunteers">)}
              className="shrink-0 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm"
            >
              {es ? "Aprobar" : "Approve"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
